import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";
import { logLeadAudit } from "@/lib/leadAudit";

type UpdatePayload = {
  status?: string;
  notes?: string;
};

const sanitize = (value?: string | null) =>
  typeof value === "string" ? value.trim() : "";

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache") ||
    lowered.includes("relation") ||
    lowered.includes("unknown")
  );
};

const tryUpdate = async (
  id: string,
  updates: Record<string, unknown>,
  dealerId?: string | null
) => {
  const sb = supabaseServer();
  let query = sb.from("leads").update(updates).eq("id", id);
  if (dealerId) {
    query = query.eq("dealer_id", dealerId);
  }
  return query.select("*").single();
};

const getLeadForDealer = async (id: string, dealerId: string) => {
  const sb = supabaseServer();
  const byDealer = await sb
    .from("leads")
    .select("id, status, notes, listing_id, dealer_id")
    .eq("id", id)
    .eq("dealer_id", dealerId)
    .single();

  if (!byDealer.error) {
    return { lead: byDealer.data, scopedByDealer: true };
  }

  if (!isMissingSchema(byDealer.error.message)) {
    return { lead: null, scopedByDealer: true };
  }

  const byId = await sb
    .from("leads")
    .select("id, status, notes, listing_id")
    .eq("id", id)
    .single();

  if (byId.error || !byId.data?.listing_id) {
    return { lead: null, scopedByDealer: false };
  }

  const listing = await sb
    .from("listings")
    .select("id")
    .eq("id", byId.data.listing_id)
    .eq("dealer_id", dealerId)
    .single();

  if (listing.error || !listing.data) {
    return { lead: null, scopedByDealer: false };
  }

  return { lead: byId.data, scopedByDealer: false };
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as UpdatePayload | null;
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload" },
      { status: 400 }
    );
  }

  const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");
  const hasNotes = Object.prototype.hasOwnProperty.call(body, "notes");
  const status = sanitize(body.status);
  const notes = sanitize(body.notes);

  if (!hasStatus && !hasNotes) {
    return NextResponse.json(
      { ok: false, error: "No updates provided" },
      { status: 400 }
    );
  }

  const { lead, scopedByDealer } = await getLeadForDealer(
    id,
    auth.dealer.id
  );

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (hasStatus && status) updates.status = status;
  if (hasNotes) updates.notes = notes || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, error: "No valid updates provided" },
      { status: 400 }
    );
  }

  const result = await tryUpdate(
    id,
    updates,
    scopedByDealer ? auth.dealer.id : null
  );

  if (!result.error) {
    const changes: Record<string, unknown> = {};
    if (hasStatus && status) {
      changes.status = { from: lead.status ?? null, to: status };
    }
    if (hasNotes) {
      changes.notes = { from: lead.notes ?? null, to: updates.notes ?? null };
    }
    await logLeadAudit({
      lead_id: id,
      action: "update",
      changes,
      actor_email: auth.user?.email ?? null,
      actor_id: auth.user?.id ?? null,
    });
    return NextResponse.json({ ok: true, lead: result.data });
  }

  if (Object.keys(updates).length > 1) {
    const warnings: string[] = [];
    let finalLead = null;

    if (hasStatus && status) {
      const statusUpdate = await tryUpdate(
        id,
        { status },
        scopedByDealer ? auth.dealer.id : null
      );
      if (!statusUpdate.error) {
        finalLead = statusUpdate.data;
        await logLeadAudit({
          lead_id: id,
          action: "update",
          changes: {
            status: { from: lead.status ?? null, to: status },
          },
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        });
      } else {
        warnings.push("status_not_saved");
      }
    }

    if (hasNotes) {
      const notesUpdate = await tryUpdate(
        id,
        { notes: notes || null },
        scopedByDealer ? auth.dealer.id : null
      );
      if (!notesUpdate.error) {
        finalLead = notesUpdate.data;
        await logLeadAudit({
          lead_id: id,
          action: "update",
          changes: {
            notes: { from: lead.notes ?? null, to: notes || null },
          },
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        });
      } else {
        warnings.push("notes_not_saved");
      }
    }

    if (finalLead) {
      return NextResponse.json({
        ok: true,
        lead: finalLead,
        warning: warnings.join(","),
      });
    }
  }

  return NextResponse.json(
    { ok: false, error: result.error.message },
    { status: 500 }
  );
}

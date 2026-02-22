import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";
import { logLeadAudit } from "@/lib/leadAudit";

type Payload = {
  ids?: string[];
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
  ids: string[],
  updates: Record<string, unknown>,
  dealerId?: string | null
) => {
  const sb = supabaseServer();
  let query = sb.from("leads").update(updates).in("id", ids);
  if (dealerId) {
    query = query.eq("dealer_id", dealerId);
  }
  return query.select("id");
};

const resolveLeadIds = async (ids: string[], dealerId: string) => {
  const sb = supabaseServer();
  const byDealer = await sb
    .from("leads")
    .select("id, listing_id, dealer_id")
    .in("id", ids)
    .eq("dealer_id", dealerId);

  if (!byDealer.error) {
    return { ids: (byDealer.data ?? []).map((row) => row.id), scoped: true };
  }

  if (!isMissingSchema(byDealer.error.message)) {
    return { ids: [], scoped: true, error: byDealer.error.message };
  }

  const listings = await sb
    .from("listings")
    .select("id")
    .eq("dealer_id", dealerId);
  if (listings.error || !listings.data?.length) {
    return { ids: [], scoped: false };
  }
  const listingIds = listings.data.map((row) => row.id);
  const byListing = await sb
    .from("leads")
    .select("id, listing_id")
    .in("id", ids)
    .in("listing_id", listingIds);

  if (byListing.error) {
    return { ids: [], scoped: false, error: byListing.error.message };
  }

  return { ids: (byListing.data ?? []).map((row) => row.id), scoped: false };
};

export async function POST(req: Request) {
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as Payload | null;
  if (!body?.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No leads selected" },
      { status: 400 }
    );
  }

  const status = sanitize(body.status);
  const notes = sanitize(body.notes);
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (notes) updates.notes = notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, error: "No updates provided" },
      { status: 400 }
    );
  }

  const resolution = await resolveLeadIds(body.ids, auth.dealer.id);
  if (resolution.error) {
    return NextResponse.json(
      { ok: false, error: resolution.error },
      { status: 500 }
    );
  }
  if (resolution.ids.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No matching leads found" },
      { status: 404 }
    );
  }

  const result = await tryUpdate(
    resolution.ids,
    updates,
    resolution.scoped ? auth.dealer.id : null
  );

  if (!result.error) {
    await Promise.all(
      resolution.ids.map((leadId) =>
        logLeadAudit({
          lead_id: leadId,
          action: "bulk_update",
          changes: updates,
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        })
      )
    );
    return NextResponse.json({ ok: true, updated: resolution.ids.length });
  }

  if (Object.keys(updates).length > 1) {
    const warnings: string[] = [];

    if (status) {
      const statusUpdate = await tryUpdate(
        resolution.ids,
        { status },
        resolution.scoped ? auth.dealer.id : null
      );
      if (statusUpdate.error) {
        warnings.push("status_not_saved");
      } else {
        await Promise.all(
          resolution.ids.map((leadId) =>
            logLeadAudit({
              lead_id: leadId,
              action: "bulk_update",
              changes: { status },
              actor_email: auth.user?.email ?? null,
              actor_id: auth.user?.id ?? null,
            })
          )
        );
      }
    }

    if (notes) {
      const notesUpdate = await tryUpdate(
        resolution.ids,
        { notes },
        resolution.scoped ? auth.dealer.id : null
      );
      if (notesUpdate.error) {
        warnings.push("notes_not_saved");
      } else {
        await Promise.all(
          resolution.ids.map((leadId) =>
            logLeadAudit({
              lead_id: leadId,
              action: "bulk_update",
              changes: { notes },
              actor_email: auth.user?.email ?? null,
              actor_id: auth.user?.id ?? null,
            })
          )
        );
      }
    }

    if (warnings.length < Object.keys(updates).length) {
      return NextResponse.json({
        ok: true,
        warning: warnings.join(","),
      });
    }
  }

  return NextResponse.json(
    { ok: false, error: result.error.message },
    { status: 500 }
  );
}

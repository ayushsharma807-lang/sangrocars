import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { logLeadAudit } from "@/lib/leadAudit";

type UpdatePayload = {
  status?: string;
  notes?: string;
  assigned_to?: string | null;
};

const sanitize = (value?: string) => value?.trim() ?? "";

const tryUpdate = async (id: string, updates: Record<string, unknown>) => {
  const sb = supabaseServer();
  return sb.from("leads").update(updates).eq("id", id).select("*").single();
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
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

  const status = sanitize(body.status);
  const notes = sanitize(body.notes);
  const hasAssigned = Object.prototype.hasOwnProperty.call(body, "assigned_to");
  const assignedRaw =
    typeof body.assigned_to === "string" ? body.assigned_to.trim() : "";
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (notes) updates.notes = notes;
  if (hasAssigned) updates.assigned_to = assignedRaw || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, error: "No updates provided" },
      { status: 400 }
    );
  }

  const sb = supabaseServer();
  const existing = await sb
    .from("leads")
    .select("id, status, notes, assigned_to")
    .eq("id", id)
    .single();

  const result = await tryUpdate(id, updates);
  if (!result.error) {
    const changes: Record<string, unknown> = {};
    if (status) {
      changes.status = { from: existing.data?.status ?? null, to: status };
    }
    if (notes) {
      changes.notes = { from: existing.data?.notes ?? null, to: notes };
    }
    if (hasAssigned) {
      changes.assigned_to = {
        from: existing.data?.assigned_to ?? null,
        to: updates.assigned_to ?? null,
      };
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

    if (status) {
      const statusUpdate = await tryUpdate(id, { status });
      if (!statusUpdate.error) {
        finalLead = statusUpdate.data;
        await logLeadAudit({
          lead_id: id,
          action: "update",
          changes: {
            status: { from: existing.data?.status ?? null, to: status },
          },
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        });
      } else {
        warnings.push("status_not_saved");
      }
    }

    if (notes) {
      const notesUpdate = await tryUpdate(id, { notes });
      if (!notesUpdate.error) {
        finalLead = notesUpdate.data;
        await logLeadAudit({
          lead_id: id,
          action: "update",
          changes: {
            notes: { from: existing.data?.notes ?? null, to: notes },
          },
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        });
      } else {
        warnings.push("notes_not_saved");
      }
    }

    if (hasAssigned) {
      const assignedUpdate = await tryUpdate(id, {
        assigned_to: assignedRaw || null,
      });
      if (!assignedUpdate.error) {
        finalLead = assignedUpdate.data;
        await logLeadAudit({
          lead_id: id,
          action: "update",
          changes: {
            assigned_to: {
              from: existing.data?.assigned_to ?? null,
              to: assignedRaw || null,
            },
          },
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        });
      } else {
        warnings.push("assigned_not_saved");
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

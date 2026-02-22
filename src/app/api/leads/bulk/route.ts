import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { logLeadAudit } from "@/lib/leadAudit";

const parseIds = (value: FormDataEntryValue[] | string[] | null) => {
  if (!value) return [];
  return value
    .map((entry) => String(entry))
    .filter(Boolean);
};

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let ids: string[] = [];
  let status = "";
  let notes = "";
  let assignedTo = "";
  let append = false;
  let returnPath: string | null = null;

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as
      | {
          ids?: string[];
          status?: string;
          notes?: string;
          assigned_to?: string;
          append?: boolean;
          return?: string;
        }
      | null;
    ids = body?.ids ?? [];
    status = body?.status ?? "";
    notes = body?.notes ?? "";
    assignedTo = body?.assigned_to ?? "";
    append = Boolean(body?.append);
    returnPath = body?.return ?? null;
  } else {
    const form = await req.formData();
    ids = parseIds(form.getAll("ids"));
    status = String(form.get("status") ?? "");
    notes = String(form.get("notes") ?? "");
    assignedTo = String(form.get("assigned_to") ?? "");
    append = String(form.get("append") ?? "") === "1";
    returnPath = String(form.get("return") ?? "");
  }

  if (!ids.length || (!status && !notes && !assignedTo)) {
    return NextResponse.json(
      { ok: false, error: "Missing ids, status, notes, or assignment" },
      { status: 400 }
    );
  }

  const wantsJson = contentType.includes("application/json");
  const auth = await requireAdmin();
  if (!auth.ok) {
    const loginUrl = new URL("/admin/login", req.url);
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(loginUrl);
  }

  const sb = supabaseServer();
  const assignedValue = assignedTo.trim();
  const assignUpdate =
    assignedTo === "" ? null : assignedValue.length > 0 ? assignedValue : null;

  const { data: existing, error: existingError } = await sb
    .from("leads")
    .select("id, status, notes, assigned_to")
    .in("id", ids);

  if (existingError) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }
  }

  if (!append) {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;
    if (assignedTo) updates.assigned_to = assignUpdate;

    const { error } = await sb.from("leads").update(updates).in("id", ids);
    if (error) {
      if (!wantsJson) {
        return NextResponse.redirect(new URL(returnPath || "/admin/leads", req.url));
      }
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (existing) {
      for (const lead of existing) {
        const changes: Record<string, unknown> = {};
        if (status) {
          changes.status = { from: lead.status ?? null, to: status };
        }
        if (notes) {
          changes.notes = { from: lead.notes ?? null, to: notes };
        }
        if (assignedTo) {
          changes.assigned_to = {
            from: lead.assigned_to ?? null,
            to: assignUpdate,
          };
        }
        await logLeadAudit({
          lead_id: String(lead.id),
          action: "bulk_update",
          changes,
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        });
      }
    }

    const redirectTo = returnPath || req.headers.get("referer") || "/admin/leads";
    return wantsJson
      ? NextResponse.json({ ok: true })
      : NextResponse.redirect(new URL(redirectTo, req.url));
  }

  if (!notes) {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (assignedTo) updates.assigned_to = assignUpdate;

    const { error } = await sb.from("leads").update(updates).in("id", ids);
    if (error) {
      if (!wantsJson) {
        return NextResponse.redirect(new URL(returnPath || "/admin/leads", req.url));
      }
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (existing) {
      for (const lead of existing) {
        const changes: Record<string, unknown> = {};
        if (status) {
          changes.status = { from: lead.status ?? null, to: status };
        }
        if (assignedTo) {
          changes.assigned_to = {
            from: lead.assigned_to ?? null,
            to: assignUpdate,
          };
        }
        await logLeadAudit({
          lead_id: String(lead.id),
          action: "bulk_update",
          changes,
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        });
      }
    }

    const redirectTo = returnPath || req.headers.get("referer") || "/admin/leads";
    return wantsJson
      ? NextResponse.json({ ok: true })
      : NextResponse.redirect(new URL(redirectTo, req.url));
  }

  if (notes) {
    const { data, error } = await sb
      .from("leads")
      .select("id, notes, status, assigned_to")
      .in("id", ids);

    if (error) {
      if (!wantsJson) {
        return NextResponse.redirect(new URL(returnPath || "/admin/leads", req.url));
      }
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    for (const lead of data ?? []) {
      const existingNotes = typeof lead?.notes === "string" ? lead.notes : "";
      const combined = existingNotes ? `${existingNotes}\n${notes}` : notes;
      const updates: Record<string, unknown> = { notes: combined };
      if (status) updates.status = status;
      if (assignedTo) updates.assigned_to = assignUpdate;
      const { error: updateError } = await sb
        .from("leads")
        .update(updates)
        .eq("id", lead.id);
      if (updateError) {
        if (!wantsJson) {
          return NextResponse.redirect(
            new URL(returnPath || "/admin/leads", req.url)
          );
        }
        return NextResponse.json(
          { ok: false, error: updateError.message },
          { status: 500 }
        );
      }

      await logLeadAudit({
        lead_id: String(lead.id),
        action: "bulk_update",
        changes: {
          notes: { from: existingNotes ?? null, to: combined },
          ...(status
            ? { status: { from: lead.status ?? null, to: status } }
            : {}),
          ...(assignedTo
            ? { assigned_to: { from: lead.assigned_to ?? null, to: assignUpdate } }
            : {}),
        },
        actor_email: auth.user?.email ?? null,
        actor_id: auth.user?.id ?? null,
      });
    }
  }

  const redirectTo = returnPath || req.headers.get("referer") || "/admin/leads";
  return wantsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL(redirectTo, req.url));
}

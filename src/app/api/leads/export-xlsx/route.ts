import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { utils, write } from "xlsx";

const ALLOWED_COLUMNS = [
  "id",
  "name",
  "phone",
  "email",
  "listing_id",
  "listing_title",
  "dealer_id",
  "assigned_to",
  "status",
  "source",
  "message",
  "notes",
  "created_at",
];

const DEFAULT_COLUMNS = [
  "name",
  "phone",
  "email",
  "listing_title",
  "status",
  "source",
  "created_at",
];

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const source = searchParams.get("source")?.trim() ?? "";
  const requestedColumns = searchParams.getAll("columns");
  const selectedColumns = requestedColumns
    .map((value) => value.trim())
    .filter((value) => ALLOWED_COLUMNS.includes(value));
  const columns = selectedColumns.length > 0 ? selectedColumns : DEFAULT_COLUMNS;

  const sb = supabaseServer();
  let query = sb.from("leads").select("*");

  if (q) {
    const term = `%${q}%`;
    query = query.or(
      `name.ilike.${term},phone.ilike.${term},email.ilike.${term},listing_title.ilike.${term}`
    );
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (source) {
    query = query.eq("source", source);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const rows = (data ?? []).map((row) => {
    const output: Record<string, unknown> = {};
    for (const column of columns) {
      output[column] = row?.[column] ?? "";
    }
    return output;
  });

  const worksheet = utils.json_to_sheet(rows, { header: columns });
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Leads");

  const buffer = write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const filename = `leads-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

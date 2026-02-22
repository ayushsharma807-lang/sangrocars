import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { parse } from "csv-parse/sync";

type Row = {
  stock_id: string;
  type: "new" | "used";
  make: string;
  model: string;
  variant?: string;
  year?: string;
  km?: string;
  fuel?: string;
  transmission?: string;
  price?: string;
  location?: string;
  description?: string;
  photos?: string;
  status?: "available" | "sold";
};

export async function POST(
  _: Request,
  { params }: { params: Promise<{ dealerId: string }> }
) {
  const { dealerId } = await params;
  const sb = supabaseServer();

  const { data: dealer, error: dErr } = await sb
    .from("dealers")
    .select("id, feed_url")
    .eq("id", dealerId)
    .single();

  if (dErr || !dealer?.feed_url) {
    return NextResponse.json(
      { ok: false, error: "Dealer feed_url missing" },
      { status: 400 }
    );
  }

  const res = await fetch(dealer.feed_url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: "Feed fetch failed" },
      { status: 400 }
    );
  }

  const rows = parse(await res.text(), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Row[];

  const seenStockIds = new Set<string>();

  for (const r of rows) {
    if (!r.stock_id) continue;
    seenStockIds.add(r.stock_id);

    const photo_urls =
      (r.photos || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);

    const payload = {
      source: "dealer_feed" as const,
      dealer_id: dealer.id,
      stock_id: r.stock_id,
      type: (r.type ?? "used") as "new" | "used",
      make: r.make ?? "",
      model: r.model ?? "",
      variant: r.variant || null,
      year: r.year ? Number(r.year) : null,
      km: r.km ? Number(r.km) : null,
      fuel: r.fuel || null,
      transmission: r.transmission || null,
      price: r.price ? Number(r.price) : null,
      location: r.location || null,
      description: r.description || null,
      photo_urls,
      status: (r.status ?? "available") as "available" | "sold",
      last_seen_at: new Date().toISOString(),
    };

    await sb.from("listings").upsert(payload, {
      onConflict: "dealer_id,stock_id",
    });
  }

  return NextResponse.json({ ok: true, rows: rows.length });
}

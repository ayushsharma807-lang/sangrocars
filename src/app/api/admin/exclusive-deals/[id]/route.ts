import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

const sanitize = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const parseList = (value: FormDataEntryValue | null, separator: RegExp) => {
  const raw = sanitize(value);
  if (!raw) return [] as string[];
  return raw
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseNumber = (value: FormDataEntryValue | null) => {
  const raw = sanitize(value);
  if (!raw) return 0;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(
      new URL("/admin/login?error=unauthorized", req.url)
    );
  }

  const form = await req.formData();
  const title = sanitize(form.get("title"));
  const dealer = sanitize(form.get("dealer"));
  const city = sanitize(form.get("city")) || null;
  const price = sanitize(form.get("price")) || null;
  const videoUrl = sanitize(form.get("video_url")) || null;
  const embedCode = sanitize(form.get("embed_code")) || null;
  const tags = parseList(form.get("tags"), /,|\n/);
  const highlights = parseList(form.get("highlights"), /\n/);
  const sortOrder = parseNumber(form.get("sort_order"));
  const isActive = Boolean(form.get("is_active"));

  if (!title || !dealer) {
    return NextResponse.redirect(
      new URL(
        `/admin/exclusive-deals?error=${encodeURIComponent(
          "Title and dealer are required."
        )}`,
        req.url
      )
    );
  }

  const payload = {
    title,
    dealer,
    city,
    price,
    video_url: videoUrl,
    embed_code: embedCode,
    tags: tags.length > 0 ? tags : null,
    highlights: highlights.length > 0 ? highlights : null,
    sort_order: sortOrder,
    is_active: isActive,
  };

  const sb = supabaseServer();
  const { error } = await sb
    .from("exclusive_deals")
    .update(payload)
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin/exclusive-deals?error=${encodeURIComponent(error.message)}`,
        req.url
      )
    );
  }

  return NextResponse.redirect(
    new URL("/admin/exclusive-deals?status=updated", req.url)
  );
}

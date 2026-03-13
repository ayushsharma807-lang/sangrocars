import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { ensureListingPhotoBucket } from "@/lib/listingPhotoBucket";
import { CAR_IMAGE_BUCKET } from "@/lib/carImageBucket";

const sanitizeExt = (value?: string | null) => {
  if (!value) return "jpg";
  const cleaned = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return cleaned || "jpg";
};

const extFromMeta = (file: { name?: string; type?: string }) => {
  const fromName = file.name?.split(".").pop();
  if (fromName) return sanitizeExt(fromName);
  const fromType = file.type?.split("/")[1];
  return sanitizeExt(fromType);
};

const slugify = (value: string) =>
  value
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "car-photo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const folder = String(body?.folder ?? "public").replace(/\.\./g, "").replace(/^\/+|\/+$/g, "") || "public";
    const files = Array.isArray(body?.files) ? body.files : [];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files to upload." }, { status: 400 });
    }

    const sb = supabaseServer();
    await ensureListingPhotoBucket(sb);

    const uploads = [] as { path: string; token: string; publicUrl: string }[];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index] as { name?: string; type?: string };
      const ext = extFromMeta(file);
      const base = slugify(String(file.name ?? `car-${index + 1}`));
      const path = `${folder}/${Date.now()}-${index}-${base}.${ext}`;
      const { data, error } = await sb.storage
        .from(CAR_IMAGE_BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data?.token) {
        return NextResponse.json(
          { error: error?.message || "Could not prepare upload." },
          { status: 500 }
        );
      }

      const { data: publicData } = sb.storage.from(CAR_IMAGE_BUCKET).getPublicUrl(path);
      uploads.push({
        path,
        token: data.token,
        publicUrl: publicData.publicUrl,
      });
    }

    return NextResponse.json({ uploads });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not prepare upload." },
      { status: 500 }
    );
  }
}

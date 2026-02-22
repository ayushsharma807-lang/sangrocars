import { supabaseServer } from "@/lib/supabase";

const LISTING_PHOTO_BUCKET = process.env.LISTING_PHOTO_BUCKET ?? "listing-photos";

const sanitizeExt = (value?: string | null) => {
  if (!value) return "jpg";
  const cleaned = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return cleaned || "jpg";
};

const extFromFile = (file: File) => {
  const fromName = file.name?.split(".").pop();
  if (fromName) return sanitizeExt(fromName);
  const fromType = file.type?.split("/")[1];
  return sanitizeExt(fromType);
};

const validImageFiles = (files: FormDataEntryValue[]) =>
  files.filter(
    (entry): entry is File =>
      typeof entry !== "string" && entry.size > 0 && entry.type.startsWith("image/")
  );

export const uploadListingPhotoFiles = async (
  files: FormDataEntryValue[],
  folder: string
) => {
  const sb = supabaseServer();
  const urls: string[] = [];
  const errors: string[] = [];
  const imageFiles = validImageFiles(files);

  for (let index = 0; index < imageFiles.length; index += 1) {
    const file = imageFiles[index];
    const ext = extFromFile(file);
    const path = `${folder}/${Date.now()}-${index}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await sb.storage
      .from(LISTING_PHOTO_BUCKET)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (error) {
      errors.push(error.message);
      continue;
    }

    const { data } = sb.storage.from(LISTING_PHOTO_BUCKET).getPublicUrl(path);
    if (data?.publicUrl) {
      urls.push(data.publicUrl);
    }
  }

  return { urls, errors };
};

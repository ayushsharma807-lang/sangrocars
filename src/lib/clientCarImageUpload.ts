import { CAR_IMAGE_BUCKET } from "@/lib/carImageBucket";
import { compressCarImage } from "@/lib/clientImageCompression";
import { supabaseBrowser } from "@/lib/supabase-browser";

type SignedUpload = {
  path: string;
  token: string;
  publicUrl: string;
};

const signUploads = async (files: File[], folder: string) => {
  const response = await fetch("/api/storage/car-images/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder,
      files: files.map((file) => ({ name: file.name, type: file.type })),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(payload?.uploads)) {
    throw new Error(payload?.error || "Could not prepare image uploads.");
  }

  return payload.uploads as SignedUpload[];
};

export const uploadCarImagesFromClient = async (
  files: File[],
  folder: string,
  onProgress?: (value: { done: number; total: number }) => void
) => {
  const validFiles = files.filter((file) => file.size > 0 && file.type.startsWith("image/"));
  if (validFiles.length === 0) {
    return [] as string[];
  }

  const compressed = await Promise.all(validFiles.map((file) => compressCarImage(file)));
  const uploads = await signUploads(compressed, folder);
  const sb = supabaseBrowser();
  const publicUrls: string[] = [];

  for (let index = 0; index < uploads.length; index += 1) {
    const signed = uploads[index];
    const file = compressed[index];
    const { error } = await sb.storage
      .from(CAR_IMAGE_BUCKET)
      .uploadToSignedUrl(signed.path, signed.token, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (error) {
      throw new Error(error.message || `Could not upload ${file.name}`);
    }

    publicUrls.push(signed.publicUrl);
    onProgress?.({ done: index + 1, total: uploads.length });
  }

  return publicUrls;
};

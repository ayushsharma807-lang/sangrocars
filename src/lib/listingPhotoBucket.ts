import { CAR_IMAGE_BUCKET } from "@/lib/carImageBucket";
import { supabaseServer } from "@/lib/supabase";

export const LISTING_PHOTO_BUCKET =
  process.env.LISTING_PHOTO_BUCKET ?? CAR_IMAGE_BUCKET;

const isNotFound = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const status = (error as { statusCode?: number }).statusCode;
  if (status === 404) return true;
  const message = String((error as { message?: string }).message ?? "");
  return message.toLowerCase().includes("not found");
};

export const ensureListingPhotoBucket = async (sb = supabaseServer()) => {
  try {
    const { data, error } = await sb.storage.getBucket(LISTING_PHOTO_BUCKET);
    if (error && isNotFound(error)) {
      await sb.storage.createBucket(LISTING_PHOTO_BUCKET, { public: true });
      return;
    }
    if (error) {
      console.log("Storage bucket lookup failed:", error);
      return;
    }
    if (data && !data.public) {
      await sb.storage.updateBucket(LISTING_PHOTO_BUCKET, { public: true });
    }
  } catch (err) {
    console.log("Storage bucket ensure failed:", err);
  }
};

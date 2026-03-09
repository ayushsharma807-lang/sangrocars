import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";
import { uploadListingPhotoFiles } from "@/lib/uploadListingPhotos";
import { buildListingExperienceDescription } from "@/lib/listingExperience";
import { DEFAULT_LISTING_SOURCE } from "@/lib/listingSource";
import { notifyPendingListing } from "@/lib/adminNotifications";
import { parseIndianMoney } from "@/lib/parseIndianMoney";
import { markListingPendingApproval } from "@/lib/listingApproval";

const parseNumber = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const num = Number(String(value));
  return Number.isFinite(num) ? num : null;
};

const parsePrice = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  return parseIndianMoney(String(value));
};

const parsePhotos = (value: FormDataEntryValue | null) => {
  if (!value) return [];
  return String(value)
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const mergePhotoUrls = (manualUrls: string[], uploadedUrls: string[]) =>
  Array.from(new Set([...manualUrls, ...uploadedUrls]));

export async function POST(req: Request) {
  const wantsJson =
    req.headers.get("x-requested-with") === "XMLHttpRequest" ||
    req.headers.get("accept")?.includes("application/json");

  const respondError = (message: string, status = 400) => {
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: message }, { status });
    }
    const url = new URL("/dealer-admin/listings/new", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  };

  const respondSuccess = (redirectTo: string) => {
    if (wantsJson) {
      return NextResponse.json({ ok: true, redirectTo });
    }
    return NextResponse.redirect(new URL(redirectTo, req.url));
  };

  try {
    const auth = await requireDealer();
    if (!auth.ok) {
      return respondError("Please sign in again.", 401);
    }

    const form = await req.formData();
    const uploaded = await uploadListingPhotoFiles(
      form.getAll("photo_files"),
      `dealer/${auth.dealer.id}`
    );
    const photoUrls = mergePhotoUrls(
      parsePhotos(form.get("photo_urls")),
      uploaded.urls
    );
    const description = buildListingExperienceDescription(
      {
        tour360Url: String(form.get("tour_360_url") ?? "").trim(),
        walkthroughVideoUrl: String(form.get("walkthrough_video_url") ?? "").trim(),
        interiorVrUrl: String(form.get("interior_vr_url") ?? "").trim(),
        arModelUrl: String(form.get("ar_model_url") ?? "").trim(),
        arIosModelUrl: String(form.get("ar_ios_model_url") ?? "").trim(),
      },
      String(form.get("description") ?? "").trim()
    );
    const payload = {
      source: DEFAULT_LISTING_SOURCE,
      dealer_id: auth.dealer.id,
      type: String(form.get("type") ?? "used"),
      make: String(form.get("make") ?? "").trim(),
      model: String(form.get("model") ?? "").trim(),
      variant: String(form.get("variant") ?? "").trim() || null,
      year: parseNumber(form.get("year")),
      km: parseNumber(form.get("km")),
      fuel: String(form.get("fuel") ?? "").trim() || null,
      transmission: String(form.get("transmission") ?? "").trim() || null,
      price: parsePrice(form.get("price")),
      location: String(form.get("location") ?? "").trim() || null,
      description: markListingPendingApproval(description),
      status: "sold",
      photo_urls: photoUrls,
    };

    if (!payload.make || !payload.model) {
      return respondError("Please add make and model.");
    }

    const sb = supabaseServer();
    const { data, error } = await sb
      .from("listings")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Dealer listing save failed:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        uploadErrors: uploaded.errors,
        payload,
      });
      return respondError(error.message || "Could not save listing.", 500);
    }

    if (uploaded.errors.length > 0) {
      console.error("Dealer listing photo upload issues:", uploaded.errors);
    }

    if (data?.id) {
      const title = [payload.year, payload.make, payload.model, payload.variant]
        .filter(Boolean)
        .join(" ");
      await notifyPendingListing({
        id: data.id,
        title: title || "Dealer listing",
        source: "dealer_dashboard",
      });
    }

    return respondSuccess("/dealer-admin/listings");
  } catch (error) {
    console.error("Dealer listing request crashed:", error);
    return respondError("Server error while saving listing.", 500);
  }
}

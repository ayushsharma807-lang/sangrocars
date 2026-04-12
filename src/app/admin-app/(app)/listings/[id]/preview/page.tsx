import { requireAdminApp } from "@/lib/adminAppGuard";
import { supabaseServer } from "@/lib/supabase";
import { normalizePhotoUrls } from "@/lib/photoUrls";

export default async function AdminAppListingPreview({
  params,
}: {
  params: { id: string };
}) {
  await requireAdminApp();
  const sb = supabaseServer();
  const { data } = await sb
    .from("listings")
    .select(
      "id, make, model, variant, year, price, km, fuel, transmission, location, description, photo_urls"
    )
    .eq("id", params.id)
    .single();

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Listing not found.
      </div>
    );
  }

  const photos = normalizePhotoUrls(data.photo_urls);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Preview</h2>
        <p className="text-sm text-slate-600">Check how the listing looks.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {photos[0] ? (
          <img
            src={photos[0]}
            alt="Listing cover"
            className="h-72 w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
            No photos uploaded yet.
          </div>
        )}
        <div className="mt-4 space-y-2">
          <h3 className="text-xl font-semibold text-slate-900">
            {[data.year, data.make, data.model, data.variant].filter(Boolean).join(" ")}
          </h3>
          <p className="text-sm text-slate-600">
            {data.location || "Location pending"} · {data.km ?? "—"} km ·{" "}
            {data.fuel || "—"} · {data.transmission || "—"}
          </p>
          <p className="text-lg font-semibold text-slate-900">
            ₹{data.price?.toLocaleString("en-IN") ?? "Price on request"}
          </p>
          <p className="text-sm text-slate-600">{data.description || "No description yet."}</p>
        </div>
      </div>
    </div>
  );
}

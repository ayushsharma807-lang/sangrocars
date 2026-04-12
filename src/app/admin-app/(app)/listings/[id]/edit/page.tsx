import { requireAdminApp } from "@/lib/adminAppGuard";
import { supabaseServer } from "@/lib/supabase";
import ListingWizard from "@/app/admin-app/components/ListingWizard";

export default async function AdminAppEditListing({
  params,
}: {
  params: { id: string };
}) {
  await requireAdminApp();
  const sb = supabaseServer();
  const { data } = await sb
    .from("listings")
    .select(
      "id, type, seller_name, seller_phone, make, model, variant, year, fuel, transmission, km, ownership, price, location, exterior_color, registration_year, registration_state, insurance_status, fitness_status, description, featured, status, photo_urls"
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Edit listing</h2>
        <p className="text-sm text-slate-600">Update details and republish.</p>
      </div>
      <ListingWizard
        mode="edit"
        initialId={data.id}
        initial={{
          listingType: data.type === "dealer" ? "dealer" : "private",
          sellerName: data.seller_name ?? "",
          sellerPhone: data.seller_phone ?? "",
          make: data.make ?? "",
          model: data.model ?? "",
          variant: data.variant ?? "",
          year: data.year ? String(data.year) : "",
          fuel: data.fuel ?? "",
          transmission: data.transmission ?? "",
          kmDriven: data.km ? String(data.km) : "",
          ownership: data.ownership ?? "",
          price: data.price ? String(data.price) : "",
          location: data.location ?? "",
          exteriorColor: data.exterior_color ?? "",
          registrationYear: data.registration_year
            ? String(data.registration_year)
            : "",
          registrationState: data.registration_state ?? "",
          insuranceStatus: data.insurance_status ?? "",
          fitnessStatus: data.fitness_status ?? "",
          description: data.description ?? "",
          featured: Boolean(data.featured),
          status: (data.status as "draft" | "available" | "sold" | "archived") ?? "draft",
        }}
        initialPhotos={data.photo_urls ?? []}
      />
    </div>
  );
}

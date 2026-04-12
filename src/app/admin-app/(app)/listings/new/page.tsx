import { requireAdminApp } from "@/lib/adminAppGuard";
import ListingWizard from "@/app/admin-app/components/ListingWizard";

export default async function AdminAppNewListing() {
  await requireAdminApp();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Add listing</h2>
        <p className="text-sm text-slate-600">
          Create a new car listing, upload photos, and publish.
        </p>
      </div>
      <ListingWizard mode="create" />
    </div>
  );
}

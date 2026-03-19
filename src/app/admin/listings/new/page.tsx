import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import AdminNewListingForm from "@/app/admin/listings/new/AdminNewListingForm";

type DealerOption = {
  id: string;
  name: string | null;
};

const errorText = {
  missing_fields: "Please fill required fields (make and model).",
  private_seller_missing:
    "Private seller name and phone are required when no dealer is selected.",
  photo_upload_failed: "Photo upload failed while creating the listing.",
  create_failed: "Could not create listing. Please try again.",
} as const;

export default async function AdminNewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; id?: string }>;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/admin/login?error=unauthorized");
  }

  const params = await searchParams;
  const sb = supabaseServer();
  const { data } = await sb
    .from("dealers")
    .select("id, name")
    .order("name", { ascending: true })
    .limit(2000);
  const dealers = (data ?? []) as DealerOption[];
  const errorKey = params.error as keyof typeof errorText | undefined;

  return (
    <main className="home">
      <section className="section admin">
        <div className="section__header">
          <div>
            <h2>Post any car</h2>
            <p>Create listing as admin for dealer inventory or private seller.</p>
          </div>
          <div className="dealer__actions">
            <Link className="btn btn--ghost" href="/admin/dealers">
              Dealers
            </Link>
            <Link className="btn btn--ghost" href="/admin/listings">
              All ads
            </Link>
            <Link className="btn btn--outline" href="/admin/leads">
              Lead inbox
            </Link>
            <Link className="btn btn--solid" href="/">
              Back to home
            </Link>
          </div>
        </div>

        {params.status === "created" && (
          <div className="admin-banner">
            Listing created successfully.{" "}
            {params.id && (
              <Link className="link" href={`/listing/${params.id}`}>
                View listing
              </Link>
            )}
          </div>
        )}
        {errorKey && (
          <div className="admin-banner admin-banner--error">{errorText[errorKey]}</div>
        )}

        <AdminNewListingForm dealers={dealers} />
      </section>
    </main>
  );
}

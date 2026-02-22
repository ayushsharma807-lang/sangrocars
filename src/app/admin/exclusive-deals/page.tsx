import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import ExclusiveDealsManager from "./ExclusiveDealsManager";

type DealRow = Record<string, unknown>;

type PageProps = {
  searchParams?: { status?: string; error?: string };
};

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("relation") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache")
  );
};

const toListString = (value: unknown, separator: string) => {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(separator);
  }
  return String(value);
};

const getDeals = async () => {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("exclusive_deals")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return { deals: (data ?? []) as DealRow[], error };
};

export default async function ExclusiveDealsAdmin({ searchParams }: PageProps) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/admin/login?error=unauthorized");
  }

  const { deals, error } = await getDeals();
  const hasSchemaError = error && isMissingSchema(error.message);

  return (
    <main className="home admin">
      <section className="section">
        <div className="section__header">
          <div>
            <h2>Exclusive deals</h2>
            <p>Create and update weekly promo video deals.</p>
          </div>
          <div className="dealer__actions">
            <Link className="btn btn--ghost" href="/admin/leads">
              Lead inbox
            </Link>
            <Link className="btn btn--ghost" href="/admin/dealers">
              Dealers
            </Link>
            <Link className="btn btn--ghost" href="/admin/listings">
              Ads
            </Link>
            <Link className="btn btn--ghost" href="/admin/listings/new">
              Post car
            </Link>
            <Link className="btn btn--outline" href="/">
              View homepage
            </Link>
          </div>
        </div>

        {searchParams?.status === "created" && (
          <div className="admin-banner">Deal added successfully.</div>
        )}
        {searchParams?.status === "updated" && (
          <div className="admin-banner">Deal updated successfully.</div>
        )}
        {searchParams?.status === "deleted" && (
          <div className="admin-banner">Deal deleted.</div>
        )}
        {searchParams?.error && (
          <div className="admin-banner admin-banner--error">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}
        {hasSchemaError && (
          <div className="admin-banner admin-banner--error">
            Exclusive deals table is missing. Run the SQL setup in Supabase.
          </div>
        )}

        <ExclusiveDealsManager
          deals={deals.map((deal) => ({
            id: String(deal.id ?? ""),
            title: String(deal.title ?? ""),
            dealer: String(deal.dealer ?? ""),
            city: String(deal.city ?? ""),
            price: String(deal.price ?? ""),
            video_url: String(deal.video_url ?? ""),
            embed_code: String(deal.embed_code ?? ""),
            tags: toListString(deal.tags, ", "),
            highlights: toListString(deal.highlights, "\n"),
            sort_order: Number(deal.sort_order ?? 0),
            is_active: Boolean(deal.is_active ?? true),
          }))}
        />
      </section>
    </main>
  );
}

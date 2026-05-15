import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";
import { updateInsuranceLeadAction } from "../actions";

export const dynamic = "force-dynamic";

const statuses = ["new", "contacted", "quote_sent", "converted", "lost", "rejected"];

type InsuranceLead = {
  id: string;
  name: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  message: string | null;
  status: string | null;
  notes: string | null;
  follow_up_date: string | null;
  vehicle_type: string | null;
  registration_number: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  fuel_type: string | null;
  previous_policy_status: string | null;
  claim_last_year: string | null;
  policy_type: string | null;
  estimated_premium_min: number | null;
  estimated_premium_max: number | null;
  created_at: string;
};

const formatMoney = (value?: number | string | null) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric);
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString("en-IN") : "-");

const whatsappUrl = (phone?: string | null, name?: string | null) => {
  const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
  return `https://wa.me/91${digits}?text=${encodeURIComponent(
    `Hi ${name ?? ""}, this is Sangro Insurance about your policy quote enquiry.`,
  )}`;
};

export default async function AdminInsuranceLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect(`/admin/login?next=${encodeURIComponent("/admin/insurance/leads")}`);
  }

  const params = await searchParams;
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("service_leads")
    .select(
      "id,name,full_name,phone,city,message,status,notes,follow_up_date,vehicle_type,registration_number,make,model,year,fuel_type,previous_policy_status,claim_last_year,policy_type,estimated_premium_min,estimated_premium_max,created_at",
    )
    .eq("service_type", "insurance")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as InsuranceLead[];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">Insurance desk</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Insurance leads</h1>
            <p className="mt-2 text-slate-600">Vehicle insurance quote requests from the public insurance page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/leads" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">
              All leads
            </Link>
            <Link href="/admin" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
              Admin home
            </Link>
          </div>
        </div>

        {params.error ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            Could not update insurance lead.
          </div>
        ) : null}
        {error ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error.message}
          </div>
        ) : null}

        <div className="grid gap-5">
          {leads.map((lead) => {
            const displayName = lead.full_name || lead.name || "Insurance lead";
            const vehicleTitle = [lead.year, lead.make, lead.model].filter(Boolean).join(" ") || "Vehicle details pending";
            return (
              <article
                key={lead.id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">{displayName}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {lead.phone || "No phone"} · {lead.city || "No city"}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                        {String(lead.status ?? "new").replaceAll("_", " ")}
                      </span>
                    </div>

                    <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Vehicle</dt>
                        <dd className="mt-2 text-lg font-black">{vehicleTitle}</dd>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Premium range</dt>
                        <dd className="mt-2 text-lg font-black">
                          {formatMoney(lead.estimated_premium_min)} - {formatMoney(lead.estimated_premium_max)}
                        </dd>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Policy</dt>
                        <dd className="mt-2 text-sm font-bold">
                          {lead.vehicle_type || "-"} · {lead.policy_type || "-"} · {lead.fuel_type || "-"}
                        </dd>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Risk signals</dt>
                        <dd className="mt-2 text-sm font-bold">
                          Policy {lead.previous_policy_status || "-"} · Claim {lead.claim_last_year || "-"}
                        </dd>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Registration</dt>
                        <dd className="mt-2 text-lg font-black">{lead.registration_number || "-"}</dd>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Created</dt>
                        <dd className="mt-2 text-sm font-bold">{formatDate(lead.created_at)}</dd>
                      </div>
                    </dl>

                    {lead.message ? (
                      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        {lead.message}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={whatsappUrl(lead.phone, displayName)}
                        target="_blank"
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                      >
                        WhatsApp
                      </a>
                      <a href={`tel:${lead.phone ?? ""}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">
                        Call
                      </a>
                    </div>
                  </div>

                  <form action={updateInsuranceLeadAction} className="rounded-3xl border border-slate-200 p-4">
                    <input type="hidden" name="id" value={lead.id} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-bold">
                        Status
                        <select
                          name="status"
                          defaultValue={lead.status ?? "new"}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-bold">
                        Follow-up date
                        <input
                          name="follow_up_date"
                          type="date"
                          defaultValue={lead.follow_up_date ?? ""}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black"
                        />
                      </label>
                    </div>
                    <label className="mt-4 block text-sm font-bold">
                      Notes
                      <textarea
                        name="notes"
                        defaultValue={lead.notes ?? ""}
                        rows={5}
                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black"
                        placeholder="Quote shared, insurer options, documents needed, renewal date..."
                      />
                    </label>
                    <button type="submit" className="mt-4 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
                      Save insurance update
                    </button>
                  </form>
                </div>
              </article>
            );
          })}

          {leads.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No insurance leads yet.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

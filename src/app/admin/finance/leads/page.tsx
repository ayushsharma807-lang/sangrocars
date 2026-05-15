import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";
import { updateFinanceLeadAction } from "../actions";

export const dynamic = "force-dynamic";

const statuses = ["new", "contacted", "in_progress", "completed", "rejected", "converted", "lost"];

const formatMoney = (value?: number | string | null) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(numeric);
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString("en-IN") : "-");

const whatsappUrl = (phone?: string | null, name?: string | null) => {
  const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
  return `https://wa.me/91${digits}?text=${encodeURIComponent(`Hi ${name ?? ""}, this is Sangro Finance about your loan pre-approval enquiry.`)}`;
};

type FinanceLead = {
  id: string;
  name: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  message: string | null;
  status: string | null;
  notes: string | null;
  follow_up_date: string | null;
  monthly_income: number | null;
  existing_emi: number | null;
  employment_type: string | null;
  cibil_range: string | null;
  loan_type: string | null;
  desired_loan_amount: number | null;
  estimated_eligible_amount: number | null;
  estimated_interest_range: string | null;
  approval_chance: string | null;
  created_at: string;
};

export default async function AdminFinanceLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect(`/admin/login?next=${encodeURIComponent("/admin/finance/leads")}`);
  }

  const params = await searchParams;
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("service_leads")
    .select("id,name,full_name,phone,city,message,status,notes,follow_up_date,monthly_income,existing_emi,employment_type,cibil_range,loan_type,desired_loan_amount,estimated_eligible_amount,estimated_interest_range,approval_chance,created_at")
    .eq("service_type", "finance")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as FinanceLead[];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">Finance desk</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Finance leads</h1>
            <p className="mt-2 text-slate-600">Loan pre-approval enquiries from the public finance page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/leads" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">All leads</Link>
            <Link href="/admin" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">Admin home</Link>
          </div>
        </div>

        {params.error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">Could not update finance lead.</div> : null}
        {error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error.message}</div> : null}

        <div className="grid gap-5">
          {leads.map((lead) => {
            const displayName = lead.full_name || lead.name || "Finance lead";
            return (
              <article key={lead.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
                <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">{displayName}</h2>
                        <p className="mt-1 text-sm text-slate-500">{lead.phone || "No phone"} · {lead.city || "No city"}</p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                        {String(lead.status ?? "new").replaceAll("_", " ")}
                      </span>
                    </div>

                    <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 p-4"><dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Income</dt><dd className="mt-2 text-lg font-black">{formatMoney(lead.monthly_income)}</dd></div>
                      <div className="rounded-2xl border border-slate-200 p-4"><dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Desired loan</dt><dd className="mt-2 text-lg font-black">{formatMoney(lead.desired_loan_amount)}</dd></div>
                      <div className="rounded-2xl border border-slate-200 p-4"><dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Eligible amount</dt><dd className="mt-2 text-lg font-black">{formatMoney(lead.estimated_eligible_amount)}</dd></div>
                      <div className="rounded-2xl border border-slate-200 p-4"><dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Interest estimate</dt><dd className="mt-2 text-lg font-black">{lead.estimated_interest_range || "-"}</dd></div>
                      <div className="rounded-2xl border border-slate-200 p-4"><dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Approval chance</dt><dd className="mt-2 text-lg font-black">{lead.approval_chance || "-"}</dd></div>
                      <div className="rounded-2xl border border-slate-200 p-4"><dt className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Profile</dt><dd className="mt-2 text-sm font-bold">{lead.employment_type || "-"} · {lead.cibil_range || "-"} · {lead.loan_type || "-"}</dd></div>
                    </dl>

                    {lead.message ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{lead.message}</p> : null}
                    <p className="mt-4 text-sm text-slate-500">Created {formatDate(lead.created_at)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={whatsappUrl(lead.phone, displayName)} target="_blank" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">WhatsApp</a>
                      <a href={`tel:${lead.phone ?? ""}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">Call</a>
                    </div>
                  </div>

                  <form action={updateFinanceLeadAction} className="rounded-3xl border border-slate-200 p-4">
                    <input type="hidden" name="id" value={lead.id} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-bold">Status
                        <select name="status" defaultValue={lead.status ?? "new"} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black">
                          {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                        </select>
                      </label>
                      <label className="text-sm font-bold">Follow-up date
                        <input name="follow_up_date" type="date" defaultValue={lead.follow_up_date ?? ""} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black" />
                      </label>
                    </div>
                    <label className="mt-4 block text-sm font-bold">Notes
                      <textarea name="notes" defaultValue={lead.notes ?? ""} rows={5} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black" placeholder="Bank options, documents needed, follow-up context..." />
                    </label>
                    <button type="submit" className="mt-4 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">Save finance update</button>
                  </form>
                </div>
              </article>
            );
          })}

          {leads.length === 0 ? <div className="rounded-[28px] border border-dashed border-slate-300 p-8 text-center text-slate-500">No finance leads yet.</div> : null}
        </div>
      </section>
    </main>
  );
}

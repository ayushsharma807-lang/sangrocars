import { supabaseServer } from "@/lib/supabase";
import { formatInr } from "@/lib/wealth";
import { updateWealthLeadAction } from "../actions";

export const dynamic = "force-dynamic";

const statuses = ["new", "contacted", "interested", "invested", "not_interested"];

const whatsappUrl = (phone?: string | null, name?: string | null) =>
  `https://wa.me/91${String(phone ?? "").replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
    `Hi ${name ?? ""}, this is Sangro Wealth about your mutual fund enquiry.`
  )}`;

export default async function WealthLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const { data: leads, error } = await sb
    .from("service_leads")
    .select("id,name,phone,email,city,message,investment_goal,monthly_sip_amount,status,notes,follow_up_date,created_at")
    .eq("service_type", "mutual_funds")
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Lead desk</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Mutual fund leads</h1>
        <p className="mt-2 text-slate-600">Change status, add notes, set follow-ups, call or WhatsApp prospects.</p>
      </div>

      {params.error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Could not update lead. Try again.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <div className="grid gap-4">
        {(leads ?? []).map((lead) => (
          <article key={lead.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{lead.name}</h2>
                    <p className="text-sm text-slate-500">
                      {lead.phone} {lead.email ? `· ${lead.email}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold capitalize">
                    {String(lead.status ?? "new").replaceAll("_", " ")}
                  </span>
                </div>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <dt className="text-slate-500">Investment goal</dt>
                    <dd className="font-semibold">{lead.investment_goal ?? "Not captured"}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <dt className="text-slate-500">Monthly SIP</dt>
                    <dd className="font-semibold">
                      {lead.monthly_sip_amount ? formatInr(Number(lead.monthly_sip_amount)) : "Not captured"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <dt className="text-slate-500">City</dt>
                    <dd className="font-semibold">{lead.city ?? "—"}</dd>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <dt className="text-slate-500">Created</dt>
                    <dd className="font-semibold">{new Date(lead.created_at).toLocaleString("en-IN")}</dd>
                  </div>
                </dl>
                {lead.message && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{lead.message}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" href={whatsappUrl(lead.phone, lead.name)} target="_blank">
                    WhatsApp
                  </a>
                  <a className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold" href={`tel:${lead.phone}`}>
                    Call
                  </a>
                </div>
              </div>

              <form action={updateWealthLeadAction} className="rounded-3xl border border-slate-200 p-4">
                <input type="hidden" name="id" value={lead.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Status
                    <select name="status" defaultValue={lead.status ?? "new"} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black">
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Follow-up date
                    <input name="follow_up_date" type="date" defaultValue={lead.follow_up_date ?? ""} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black" />
                  </label>
                </div>
                <label className="mt-4 block text-sm font-semibold">
                  Notes
                  <textarea name="notes" defaultValue={lead.notes ?? ""} rows={4} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-black" placeholder="Call notes, documents needed, follow-up context..." />
                </label>
                <button className="mt-4 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit">
                  Save lead update
                </button>
              </form>
            </div>
          </article>
        ))}
        {(leads ?? []).length === 0 && (
          <div className="rounded-[28px] border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No mutual fund leads yet.
          </div>
        )}
      </div>
    </section>
  );
}

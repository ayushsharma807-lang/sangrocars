import Link from "next/link";
import BulkSelectAll from "./BulkSelectAll";
import { supabaseServer } from "@/lib/supabase";
import { getStaffOptions } from "@/lib/staff";

type LeadRow = Record<string, unknown>;
type LeadFilters = {
  q?: string;
  status?: string;
  source?: string;
};

const STATUS_OPTIONS = [
  "new",
  "contacted",
  "in_progress",
  "closed",
  "won",
  "lost",
];

const EXPORT_COLUMNS = [
  { key: "id", label: "ID", default: false },
  { key: "name", label: "Name", default: true },
  { key: "phone", label: "Phone", default: true },
  { key: "email", label: "Email", default: true },
  { key: "listing_title", label: "Listing title", default: true },
  { key: "listing_id", label: "Listing ID", default: false },
  { key: "dealer_id", label: "Dealer ID", default: false },
  { key: "assigned_to", label: "Assigned to", default: false },
  { key: "status", label: "Status", default: true },
  { key: "source", label: "Source", default: true },
  { key: "message", label: "Message", default: false },
  { key: "notes", label: "Notes", default: false },
  { key: "created_at", label: "Created at", default: true },
];

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getLeadField = (lead: LeadRow, keys: string[]) => {
  for (const key of keys) {
    if (lead?.[key]) return lead[key];
  }
  return null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const matchesQuery = (value: unknown, query: string) => {
  if (!value) return false;
  return String(value).toLowerCase().includes(query);
};

const filterLeadsLocal = (leads: LeadRow[], filters: LeadFilters) => {
  const q = filters.q?.trim().toLowerCase() ?? "";
  const status = filters.status?.trim().toLowerCase();
  const source = filters.source?.trim().toLowerCase();

  return leads.filter((lead) => {
    if (status && String(lead?.status ?? "").toLowerCase() !== status) {
      return false;
    }
    if (source && String(lead?.source ?? "").toLowerCase() !== source) {
      return false;
    }
    if (!q) return true;
    return (
      matchesQuery(lead?.name, q) ||
      matchesQuery(lead?.phone, q) ||
      matchesQuery(lead?.email, q) ||
      matchesQuery(lead?.listing_title, q)
    );
  });
};

const getLeads = async (filters: LeadFilters) => {
  const sb = supabaseServer();
  let data: LeadRow[] | null = null;
  let error: string | null = null;

  let query = sb.from("leads").select("*");
  const q = filters.q?.trim();
  if (q) {
    const term = `%${q}%`;
    query = query.or(
      `name.ilike.${term},phone.ilike.${term},email.ilike.${term},listing_title.ilike.${term}`
    );
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  const ordered = await query.order("created_at", {
    ascending: false,
  });

  if (ordered.error) {
    const fallback = await sb.from("leads").select("*");
    if (fallback.error) {
      error = fallback.error.message;
    } else {
      data = filterLeadsLocal(fallback.data ?? [], filters);
    }
  } else {
    data = ordered.data ?? [];
  }

  return { data: data ?? [], error };
};

const getLeadStats = async () => {
  const sb = supabaseServer();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const stats = {
    totalNew: 0,
    last24h: 0,
    latest: [] as LeadRow[],
    error: null as string | null,
  };

  const latest = await sb
    .from("leads")
    .select("id, name, phone, listing_title, created_at", { count: "exact" })
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(3);

  if (latest.error) {
    stats.error = latest.error.message;
    return stats;
  }

  stats.totalNew = latest.count ?? 0;
  stats.latest = latest.data ?? [];

  const recent = await sb
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "new")
    .gte("created_at", since);

  if (!recent.error) {
    stats.last24h = recent.count ?? 0;
  }

  return stats;
};

const getDealerStats = async () => {
  const sb = supabaseServer();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const stats = {
    totalDealers: 0,
    new7d: 0,
    liveInventoryDealers: 0,
    error: null as string | null,
  };

  const total = await sb
    .from("dealers")
    .select("id", { count: "exact", head: true });
  if (total.error) {
    stats.error = total.error.message;
    return stats;
  }
  stats.totalDealers = total.count ?? 0;

  const recent = await sb
    .from("dealers")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (!recent.error) {
    stats.new7d = recent.count ?? 0;
  }

  const liveListings = await sb
    .from("listings")
    .select("dealer_id")
    .eq("status", "available")
    .not("dealer_id", "is", null)
    .limit(10000);
  if (!liveListings.error) {
    const uniqueDealers = new Set(
      (liveListings.data ?? [])
        .map((row) => String(row.dealer_id ?? ""))
        .filter(Boolean)
    );
    stats.liveInventoryDealers = uniqueDealers.size;
  }

  return stats;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    source?: string | string[];
    imported?: string;
    skipped?: string;
    failed?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = {
    q: getParam(params.q),
    status: getParam(params.status),
    source: getParam(params.source),
  };
  const [{ data: leads, error }, stats, dealerStats] = await Promise.all([
    getLeads(filters),
    getLeadStats(),
    getDealerStats(),
  ]);
  const staffOptions = await getStaffOptions();
  const staffMap = new Map(
    staffOptions.map((staff) => [staff.id, staff.name])
  );
  const sources = Array.from(
    new Set(
      leads
        .map((lead) => lead?.source)
        .filter(Boolean)
        .map((value) => String(value))
    )
  );
  const returnParams = new URLSearchParams();
  if (filters.q) returnParams.set("q", filters.q);
  if (filters.status) returnParams.set("status", filters.status);
  if (filters.source) returnParams.set("source", filters.source);
  const returnPath = `/admin/leads${
    returnParams.toString() ? `?${returnParams.toString()}` : ""
  }`;
  const authConfigMissing = !(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const bulkFormId = "bulk-leads-form";
  const importResult =
    params.imported || params.skipped || params.failed
      ? {
          imported: params.imported ?? "0",
          skipped: params.skipped ?? "0",
          failed: params.failed ?? "0",
        }
      : null;

  return (
    <main className="home">
      <section className="section admin">
        <div className="section__header">
          <div>
            <h2>Lead inbox</h2>
            <p>New callback requests submitted from listings.</p>
          </div>
          <div className="dealer__actions">
            <form method="post" action="/api/admin/logout">
              <button className="btn btn--ghost" type="submit">
                Log out
              </button>
            </form>
            <Link className="btn btn--outline" href="#export">
              Export CSV
            </Link>
            <Link className="btn btn--outline" href="/admin/exclusive-deals">
              Exclusive deals
            </Link>
            <Link className="btn btn--outline" href="/admin/dealers">
              Dealers
            </Link>
            <Link className="btn btn--outline" href="/admin/listings">
              Ads
            </Link>
            <Link className="btn btn--outline" href="/admin/listings/new">
              Post car
            </Link>
            <Link className="btn btn--solid" href="/">
              Back to home
            </Link>
          </div>
        </div>
        {authConfigMissing && (
          <div className="admin-banner">
            Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY to protect admin pages.
          </div>
        )}
        {stats.error ? (
          <div className="admin-banner admin-banner--error">
            Unable to load lead notifications.
          </div>
        ) : (
          <div className="admin-notifications">
            <div className="notification-card">
              <h3>New leads</h3>
              <p className="notification-value">{stats.totalNew}</p>
              <p className="notification-meta">Last 24h: {stats.last24h}</p>
            </div>
            <div className="notification-card">
              <h3>Dealer accounts</h3>
              {dealerStats.error ? (
                <p className="notification-empty">Dealer stats unavailable.</p>
              ) : (
                <>
                  <p className="notification-value">{dealerStats.totalDealers}</p>
                  <p className="notification-meta">
                    New 7d: {dealerStats.new7d} • Live inventory:{" "}
                    {dealerStats.liveInventoryDealers}
                  </p>
                </>
              )}
            </div>
            <div className="notification-card">
              <h3>Latest new leads</h3>
              {stats.latest.length === 0 ? (
                <p className="notification-empty">No new leads yet.</p>
              ) : (
                <ul className="notification-list">
                  {stats.latest.map((lead) => {
                    const leadId = lead.id ? String(lead.id) : null;
                    const name = getLeadField(lead, ["name"]) ?? "Lead";
                    const listingTitle =
                      getLeadField(lead, ["listing_title"]) ?? "Listing";
                    const createdAt = getLeadField(lead, ["created_at"]);
                    const nameText = String(name);
                    const listingTitleText = String(listingTitle);

                    return (
                      <li key={leadId ?? `lead-${nameText}`}>
                        {leadId ? (
                          <Link
                            className="link"
                            href={`/admin/leads/${leadId}`}
                          >
                            {nameText} • {listingTitleText}
                          </Link>
                        ) : (
                          <span>
                            {nameText} • {listingTitleText}
                          </span>
                        )}
                        <span className="notification-time">
                          {formatDate(
                            createdAt ? String(createdAt) : undefined
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
        {importResult && (
          <div className="admin-banner">
            Import complete. Imported: {importResult.imported}, Skipped:{" "}
            {importResult.skipped}, Failed: {importResult.failed}.
          </div>
        )}
        <form className="admin-filter" method="get">
          <label>
            Search
            <input
              name="q"
              placeholder="Name, phone, email, listing"
              defaultValue={filters.q}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={filters.status ?? ""}>
              <option value="">All</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source
            <select name="source" defaultValue={filters.source ?? ""}>
              <option value="">All</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn--solid" type="submit">
            Apply filters
          </button>
          <Link className="btn btn--ghost" href="/admin/leads">
            Clear
          </Link>
        </form>
        <form
          className="export-form"
          method="get"
          action="/api/leads/export"
          id="export"
        >
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          {filters.status && (
            <input type="hidden" name="status" value={filters.status} />
          )}
          {filters.source && (
            <input type="hidden" name="source" value={filters.source} />
          )}
          <div className="export-header">
            <div>
              <h3>Export CSV</h3>
              <p>Choose the columns you want to export.</p>
            </div>
            <button className="btn btn--outline" type="submit">
              Download CSV
            </button>
          </div>
          <div className="export-options">
            {EXPORT_COLUMNS.map((column) => (
              <label key={column.key} className="export-option">
                <input
                  type="checkbox"
                  name="columns"
                  value={column.key}
                  defaultChecked={column.default}
                />
                {column.label}
              </label>
            ))}
          </div>
        </form>
        <form
          className="import-form"
          method="post"
          action="/api/leads/import"
          encType="multipart/form-data"
        >
          <input type="hidden" name="return" value={returnPath} />
          <div className="export-header">
            <div>
              <h3>Import CSV</h3>
              <p>
                Upload a CSV with headers like name, phone, email, listing_title,
                status, source.
              </p>
            </div>
            <button className="btn btn--solid" type="submit">
              Import leads
            </button>
          </div>
          <div className="import-options">
            <label>
              CSV file
              <input name="file" type="file" accept=".csv" required />
            </label>
            <label>
              Default status
              <select name="status" defaultValue="new">
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Default source
              <input name="source" placeholder="import" defaultValue="import" />
            </label>
            <label>
              Assign to
              <select name="assigned_to">
                <option value="">Unassigned</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>
        {error ? (
          <div className="empty">Failed to load leads: {error}</div>
        ) : (
          <form
            className="bulk-form"
            method="post"
            action="/api/leads/bulk"
            id={bulkFormId}
          >
            <input type="hidden" name="return" value={returnPath} />
            <div className="bulk-actions">
              <label>
                Bulk status
                <select name="status">
                  <option value="">Select status</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Assign to
                <select name="assigned_to">
                  <option value="">Unassigned</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Bulk notes
                <textarea
                  name="notes"
                  placeholder="Add a note to selected leads"
                  rows={2}
                />
              </label>
              <label className="bulk-checkbox">
                <input type="checkbox" name="append" value="1" />
                Append to existing notes
              </label>
              <button className="btn btn--solid" type="submit">
                Update selected
              </button>
            </div>
            <div className="table-wrapper">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>
                      <BulkSelectAll formId={bulkFormId} />
                    </th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Listing</th>
                    <th>Dealer</th>
                    <th>Assigned</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="empty">
                        No leads yet.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead, index) => {
                      const listingId = getLeadField(lead, [
                        "listing_id",
                        "listingId",
                      ]);
                      const dealerId = getLeadField(lead, [
                        "dealer_id",
                        "dealerId",
                      ]);
                      const listingTitle = getLeadField(lead, [
                        "listing_title",
                        "listingTitle",
                      ]);
                      const name = getLeadField(lead, ["name"]);
                      const phone = getLeadField(lead, ["phone", "mobile"]);
                      const email = getLeadField(lead, ["email"]);
                      const assignedTo = getLeadField(lead, [
                        "assigned_to",
                        "assignedTo",
                      ]);
                      const assignedName = assignedTo
                        ? staffMap.get(String(assignedTo)) ?? "Assigned"
                        : "Unassigned";
                      const source = getLeadField(lead, ["source"]);
                      const status = getLeadField(lead, ["status"]);
                      const createdAt = getLeadField(lead, ["created_at"]);
                      const rowKey = lead.id
                        ? String(lead.id)
                        : `${String(phone ?? "lead")}-${index}`;
                      const nameText = name ? String(name) : "—";
                      const phoneText = phone ? String(phone) : "—";
                      const emailText = email ? String(email) : "—";
                      const sourceText = source ? String(source) : "—";
                      const statusText = status ? String(status) : "—";
                      const listingIdText = listingId ? String(listingId) : null;
                      const listingTitleText = listingTitle
                        ? String(listingTitle)
                        : null;
                      const dealerIdText = dealerId ? String(dealerId) : null;
                      const leadId = lead.id ? String(lead.id) : null;
                      const createdAtText = createdAt ? String(createdAt) : null;

                      return (
                        <tr key={rowKey}>
                          <td>
                            {leadId ? (
                              <input
                                type="checkbox"
                                name="ids"
                                value={leadId}
                              />
                            ) : (
                              <input type="checkbox" disabled />
                            )}
                          </td>
                          <td>{nameText}</td>
                          <td>{phoneText}</td>
                          <td>{emailText}</td>
                          <td>
                            {listingIdText ? (
                              <Link
                                className="link"
                                href={`/listing/${listingIdText}`}
                              >
                                {listingTitleText ?? listingIdText.slice(0, 8)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            {dealerIdText ? (
                              <Link
                                className="link"
                                href={`/dealer/${dealerIdText}`}
                              >
                                {dealerIdText.slice(0, 8)}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{assignedName}</td>
                          <td>{sourceText}</td>
                          <td>
                            <span className="status-badge">{statusText}</span>
                          </td>
                          <td>{formatDate(createdAtText)}</td>
                          <td>
                            {leadId ? (
                              <Link
                                className="link"
                                href={`/admin/leads/${leadId}`}
                              >
                                View
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

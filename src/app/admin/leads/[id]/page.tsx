import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import LeadUpdateForm from "./LeadUpdateForm";
import { getStaffOptions } from "@/lib/staff";

type LeadRow = Record<string, unknown>;

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

const asString = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return null;
  return String(value);
};

const displayText = (value: unknown, fallback = "—") => {
  const text = asString(value)?.trim();
  return text ? text : fallback;
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main className="home">
        <section className="section admin">
          <div className="section__header">
            <div>
              <h2>Lead not found</h2>
              <p>We could not find that lead.</p>
            </div>
            <Link className="btn btn--solid" href="/admin/leads">
              Back to leads
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const lead = data as LeadRow;
  const name = getLeadField(lead, ["name"]);
  const phone = getLeadField(lead, ["phone", "mobile"]);
  const email = getLeadField(lead, ["email"]);
  const message = getLeadField(lead, ["message"]);
  const listingId = getLeadField(lead, ["listing_id", "listingId"]);
  const listingTitle = getLeadField(lead, ["listing_title", "listingTitle"]);
  const dealerId = getLeadField(lead, ["dealer_id", "dealerId"]);
  const source = getLeadField(lead, ["source"]);
  const status = getLeadField(lead, ["status"]);
  const notes = getLeadField(lead, ["notes"]);
  const assignedTo = getLeadField(lead, ["assigned_to", "assignedTo"]);
  const createdAt = getLeadField(lead, ["created_at"]);
  const staffOptions = await getStaffOptions();
  const assignedName =
    staffOptions.find((staff) => staff.id === String(assignedTo ?? ""))?.name ??
    null;
  const nameText = displayText(name);
  const phoneText = displayText(phone);
  const emailText = displayText(email);
  const sourceText = displayText(source);
  const statusText = displayText(status);
  const messageText = displayText(message, "No message provided.");
  const listingIdText = asString(listingId);
  const listingTitleText = asString(listingTitle);
  const dealerIdText = asString(dealerId);
  const createdAtText = asString(createdAt);

  return (
    <main className="home">
      <section className="section admin lead-detail">
        <div className="section__header">
          <div>
            <h2>Lead details</h2>
            <p>Lead ID: {id}</p>
          </div>
          <div className="dealer__actions">
            <Link className="btn btn--ghost" href="/admin/leads">
              Back to leads
            </Link>
            <Link className="btn btn--solid" href="/">
              Back to home
            </Link>
          </div>
        </div>
        <div className="lead-detail__grid">
          <div className="lead-detail__card">
            <h3>Lead info</h3>
            <div className="lead-detail__row">
              <span>Name</span>
              <strong>{nameText}</strong>
            </div>
            <div className="lead-detail__row">
              <span>Phone</span>
              <strong>{phoneText}</strong>
            </div>
            <div className="lead-detail__row">
              <span>Email</span>
              <strong>{emailText}</strong>
            </div>
            <div className="lead-detail__row">
              <span>Source</span>
              <strong>{sourceText}</strong>
            </div>
            <div className="lead-detail__row">
              <span>Status</span>
              <strong>{statusText}</strong>
            </div>
            <div className="lead-detail__row">
              <span>Assigned to</span>
              <strong>{assignedName ?? "Unassigned"}</strong>
            </div>
            <div className="lead-detail__row">
              <span>Created</span>
              <strong>{formatDate(createdAtText)}</strong>
            </div>
            <div className="lead-detail__row">
              <span>Listing</span>
              {listingIdText ? (
                <Link className="link" href={`/listing/${listingIdText}`}>
                  {listingTitleText ?? listingIdText.slice(0, 8)}
                </Link>
              ) : (
                <strong>—</strong>
              )}
            </div>
            <div className="lead-detail__row">
              <span>Dealer</span>
              {dealerIdText ? (
                <Link className="link" href={`/dealer/${dealerIdText}`}>
                  {dealerIdText.slice(0, 8)}
                </Link>
              ) : (
                <strong>—</strong>
              )}
            </div>
          </div>
          <div className="lead-detail__card">
            <h3>Message</h3>
            <p className="lead-detail__message">{messageText}</p>
          </div>
          <div className="lead-detail__card">
            <h3>Update lead</h3>
            <LeadUpdateForm
              leadId={id}
              initialStatus={status ? String(status) : null}
              initialNotes={notes ? String(notes) : null}
              initialAssignedTo={assignedTo ? String(assignedTo) : null}
              staffOptions={staffOptions}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

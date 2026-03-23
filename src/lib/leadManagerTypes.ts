export type LeadSource = "Instagram" | "Facebook" | "WhatsApp" | "Call";
export type LeadStatus =
  | "new"
  | "contacted"
  | "follow_up"
  | "visit_scheduled"
  | "closed"
  | "lost";

export type LeadRecord = {
  id: string;
  full_name: string;
  phone: string;
  city: string | null;
  budget: string | null;
  interested_car: string | null;
  source: LeadSource | null;
  cash_or_finance: string | null;
  status: LeadStatus | null;
  notes: string | null;
  next_follow_up_date: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export const LEAD_SOURCES: LeadSource[] = [
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Call",
];

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "follow_up",
  "visit_scheduled",
  "closed",
  "lost",
];

export const formatLeadStatus = (value?: string | null) => {
  if (!value) return "—";
  return value.replace(/_/g, " ");
};

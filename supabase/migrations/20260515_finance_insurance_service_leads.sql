-- Finance and insurance lead metadata for Sangro service workflows.
-- Public forms still insert leads through the server route; admins manage them from admin pages.

alter table public.service_leads
  add column if not exists full_name text,
  add column if not exists monthly_income numeric,
  add column if not exists existing_emi numeric,
  add column if not exists employment_type text,
  add column if not exists cibil_range text,
  add column if not exists loan_type text,
  add column if not exists desired_loan_amount numeric,
  add column if not exists estimated_eligible_amount numeric,
  add column if not exists estimated_interest_range text,
  add column if not exists approval_chance text,
  add column if not exists vehicle_type text,
  add column if not exists registration_number text,
  add column if not exists make text,
  add column if not exists model text,
  add column if not exists year numeric,
  add column if not exists fuel_type text,
  add column if not exists previous_policy_status text,
  add column if not exists claim_last_year text,
  add column if not exists policy_type text,
  add column if not exists estimated_premium_min numeric,
  add column if not exists estimated_premium_max numeric;

alter table public.service_leads
  drop constraint if exists service_leads_status_check;

alter table public.service_leads
  add constraint service_leads_status_check
  check (
    status in (
      'new',
      'contacted',
      'interested',
      'invested',
      'not_interested',
      'in_progress',
      'completed',
      'rejected',
      'quote_sent',
      'converted',
      'lost'
    )
  );

create index if not exists service_leads_finance_created_idx
  on public.service_leads(created_at desc)
  where service_type = 'finance';

create index if not exists service_leads_insurance_created_idx
  on public.service_leads(created_at desc)
  where service_type = 'insurance';

create index if not exists service_leads_approval_chance_idx
  on public.service_leads(approval_chance)
  where service_type = 'finance';

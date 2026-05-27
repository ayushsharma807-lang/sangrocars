alter table public.service_leads
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists investment_type text,
  add column if not exists monthly_sip_amount numeric,
  add column if not exists one_time_amount numeric,
  add column if not exists investment_goal text,
  add column if not exists notes text,
  add column if not exists follow_up_date date,
  add column if not exists updated_at timestamptz not null default now();

alter table public.service_leads
  drop constraint if exists service_leads_investment_type_check;

alter table public.service_leads
  add constraint service_leads_investment_type_check
  check (
    investment_type is null
    or investment_type in ('Monthly SIP', 'One Time', 'Both')
  );

create index if not exists service_leads_mutual_funds_created_idx
  on public.service_leads (created_at desc)
  where service_type = 'mutual_funds';

begin;

create extension if not exists pgcrypto;

create table if not exists public.lead_manager_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  city text,
  budget text,
  interested_car text,
  source text,
  cash_or_finance text,
  status text default 'new',
  notes text,
  next_follow_up_date date,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_manager_leads_status_idx
  on public.lead_manager_leads (status);
create index if not exists lead_manager_leads_source_idx
  on public.lead_manager_leads (source);
create index if not exists lead_manager_leads_next_follow_up_idx
  on public.lead_manager_leads (next_follow_up_date);

alter table public.lead_manager_leads enable row level security;

-- We rely on service-role server access from Next.js routes.

drop trigger if exists set_updated_at_on_lead_manager_leads on public.lead_manager_leads;
create trigger set_updated_at_on_lead_manager_leads
before update on public.lead_manager_leads
for each row execute function public.set_updated_at();

commit;

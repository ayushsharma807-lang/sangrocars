create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.service_leads
  add column if not exists email text,
  add column if not exists investment_goal text,
  add column if not exists monthly_sip_amount numeric,
  add column if not exists notes text,
  add column if not exists follow_up_date date,
  add column if not exists updated_at timestamptz not null default now();

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
      'rejected'
    )
  );

drop trigger if exists service_leads_set_updated_at on public.service_leads;
create trigger service_leads_set_updated_at
before update on public.service_leads
for each row execute function public.set_updated_at();

create table if not exists public.wealth_customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text,
  email text,
  pan_placeholder text,
  city text,
  joined_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wealth_investments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.wealth_customers(id) on delete cascade,
  fund_name text not null,
  scheme_code text,
  investment_date date not null default current_date,
  amount_invested numeric not null default 0,
  nav_on_investment_date numeric not null default 0,
  units_bought numeric not null default 0,
  transaction_type text not null default 'sip' check (transaction_type in ('sip', 'lump_sum')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wealth_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  customer_id uuid references public.wealth_customers(id) on delete set null,
  lead_id uuid references public.service_leads(id) on delete set null,
  investment_id uuid references public.wealth_investments(id) on delete set null,
  activity_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists service_leads_service_created_idx on public.service_leads(service_type, created_at desc);
create index if not exists service_leads_status_idx on public.service_leads(status);
create index if not exists wealth_customers_profile_idx on public.wealth_customers(profile_id);
create index if not exists wealth_customers_phone_idx on public.wealth_customers(phone);
create index if not exists wealth_customers_email_idx on public.wealth_customers(email);
create index if not exists wealth_investments_customer_idx on public.wealth_investments(customer_id);
create index if not exists wealth_investments_scheme_idx on public.wealth_investments(scheme_code);
create index if not exists wealth_activity_logs_created_idx on public.wealth_activity_logs(created_at desc);

drop trigger if exists wealth_customers_set_updated_at on public.wealth_customers;
create trigger wealth_customers_set_updated_at
before update on public.wealth_customers
for each row execute function public.set_updated_at();

drop trigger if exists wealth_investments_set_updated_at on public.wealth_investments;
create trigger wealth_investments_set_updated_at
before update on public.wealth_investments
for each row execute function public.set_updated_at();

alter table public.service_leads enable row level security;
alter table public.wealth_customers enable row level security;
alter table public.wealth_investments enable row level security;
alter table public.wealth_activity_logs enable row level security;

drop policy if exists "Public can create service leads" on public.service_leads;
create policy "Public can create service leads"
on public.service_leads
for insert
to anon, authenticated
with check (
  service_type in ('finance','insurance','mutual_funds','properties','cars')
  and nullif(trim(name), '') is not null
  and nullif(trim(phone), '') is not null
);

drop policy if exists "Admins can manage service leads" on public.service_leads;
create policy "Admins can manage service leads"
on public.service_leads
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage wealth customers" on public.wealth_customers;
create policy "Admins can manage wealth customers"
on public.wealth_customers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers can read own wealth profile" on public.wealth_customers;
create policy "Customers can read own wealth profile"
on public.wealth_customers
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "Admins can manage wealth investments" on public.wealth_investments;
create policy "Admins can manage wealth investments"
on public.wealth_investments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers can read own wealth investments" on public.wealth_investments;
create policy "Customers can read own wealth investments"
on public.wealth_investments
for select
to authenticated
using (
  exists (
    select 1
    from public.wealth_customers wc
    where wc.id = wealth_investments.customer_id
      and wc.profile_id = auth.uid()
  )
);

drop policy if exists "Admins can manage wealth activity logs" on public.wealth_activity_logs;
create policy "Admins can manage wealth activity logs"
on public.wealth_activity_logs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Customers can read own wealth activity logs" on public.wealth_activity_logs;
create policy "Customers can read own wealth activity logs"
on public.wealth_activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.wealth_customers wc
    where wc.id = wealth_activity_logs.customer_id
      and wc.profile_id = auth.uid()
  )
);

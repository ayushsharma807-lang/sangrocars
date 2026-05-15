begin;

create extension if not exists pgcrypto;

alter table if exists public.profiles
  add column if not exists name text,
  add column if not exists phone text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin', 'customer'));
  end if;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create table if not exists public.mutual_fund_holdings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  fund_name text not null,
  scheme_code text,
  folio_number text,
  units numeric default 0,
  invested_amount numeric default 0,
  sip_amount numeric default 0,
  latest_nav numeric default 0,
  current_value numeric default 0,
  profit_loss numeric default 0,
  last_updated timestamptz default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  request_type text check (request_type in ('invest', 'withdraw', 'sip_start', 'sip_stop', 'sip_change')),
  amount numeric,
  message text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'rejected')),
  created_at timestamptz default now()
);

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  policy_name text,
  company text,
  premium_amount numeric,
  renewal_date date,
  document_url text,
  created_at timestamptz default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete cascade,
  loan_type text,
  total_amount numeric,
  emi numeric,
  due_date date,
  status text,
  created_at timestamptz default now()
);

create index if not exists mutual_fund_holdings_customer_id_idx
  on public.mutual_fund_holdings(customer_id);

create index if not exists mutual_fund_holdings_scheme_code_idx
  on public.mutual_fund_holdings(scheme_code);

create index if not exists service_requests_customer_id_idx
  on public.service_requests(customer_id);

create index if not exists service_requests_status_idx
  on public.service_requests(status);

create index if not exists insurance_policies_customer_id_idx
  on public.insurance_policies(customer_id);

create index if not exists insurance_policies_renewal_date_idx
  on public.insurance_policies(renewal_date);

create index if not exists loans_customer_id_idx
  on public.loans(customer_id);

create index if not exists loans_due_date_idx
  on public.loans(due_date);

alter table public.profiles enable row level security;
alter table public.mutual_fund_holdings enable row level security;
alter table public.service_requests enable row level security;
alter table public.insurance_policies enable row level security;
alter table public.loans enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profiles self read'
  ) then
    create policy "Profiles self read"
      on public.profiles
      for select
      using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Profiles admin write'
  ) then
    create policy "Profiles admin write"
      on public.profiles
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'mutual_fund_holdings'
      and policyname = 'Mutual fund holdings admin write'
  ) then
    create policy "Mutual fund holdings admin write"
      on public.mutual_fund_holdings
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'mutual_fund_holdings'
      and policyname = 'Mutual fund holdings customer read own'
  ) then
    create policy "Mutual fund holdings customer read own"
      on public.mutual_fund_holdings
      for select
      using (customer_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'service_requests'
      and policyname = 'Service requests admin write'
  ) then
    create policy "Service requests admin write"
      on public.service_requests
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'service_requests'
      and policyname = 'Service requests customer read own'
  ) then
    create policy "Service requests customer read own"
      on public.service_requests
      for select
      using (customer_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'service_requests'
      and policyname = 'Service requests customer insert own'
  ) then
    create policy "Service requests customer insert own"
      on public.service_requests
      for insert
      with check (customer_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'insurance_policies'
      and policyname = 'Insurance policies admin write'
  ) then
    create policy "Insurance policies admin write"
      on public.insurance_policies
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'insurance_policies'
      and policyname = 'Insurance policies customer read own'
  ) then
    create policy "Insurance policies customer read own"
      on public.insurance_policies
      for select
      using (customer_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'loans'
      and policyname = 'Loans admin write'
  ) then
    create policy "Loans admin write"
      on public.loans
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'loans'
      and policyname = 'Loans customer read own'
  ) then
    create policy "Loans customer read own"
      on public.loans
      for select
      using (customer_id = auth.uid());
  end if;
end $$;

commit;

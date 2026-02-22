-- CarHub Supabase setup / upgrade
-- Run this once in Supabase SQL Editor for your project.

begin;

create extension if not exists pgcrypto;

-- Dealers: add columns used by admin/dealer flows.
alter table if exists public.dealers
  add column if not exists auth_user_id uuid,
  add column if not exists email text,
  add column if not exists owner_email text,
  add column if not exists contact_email text,
  add column if not exists description text,
  add column if not exists logo_url text,
  add column if not exists inventory_url text,
  add column if not exists sitemap_url text,
  add column if not exists updated_at timestamptz default now();

-- Leads table for callback requests.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  dealer_id uuid references public.dealers(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  message text,
  source text default 'website',
  listing_title text,
  status text default 'new',
  notes text,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_dealer_id_idx on public.leads (dealer_id);
create index if not exists leads_listing_id_idx on public.leads (listing_id);
create index if not exists leads_source_idx on public.leads (source);

-- Lead audit trail.
create table if not exists public.lead_audit (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  action text not null,
  changes jsonb,
  actor_email text,
  actor_id text,
  created_at timestamptz not null default now()
);

create index if not exists lead_audit_lead_id_idx on public.lead_audit (lead_id);
create index if not exists lead_audit_created_at_idx on public.lead_audit (created_at desc);

-- Dealer <-> auth user mapping.
create table if not exists public.dealer_users (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

create unique index if not exists dealer_users_dealer_user_uidx
  on public.dealer_users (dealer_id, user_id);
create index if not exists dealer_users_user_id_idx on public.dealer_users (user_id);

-- Weekly exclusive deals content.
create table if not exists public.exclusive_deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  dealer text not null,
  city text,
  price text,
  video_url text,
  embed_code text,
  tags text[],
  highlights text[],
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exclusive_deals_sort_idx
  on public.exclusive_deals (is_active, sort_order, created_at desc);

-- Optional staff directory used for lead assignment.
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  created_at timestamptz not null default now()
);

create unique index if not exists staff_email_uidx on public.staff (lower(email));

-- Optional profile fallbacks.
create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_profiles (
  id uuid primary key,
  email text,
  full_name text,
  phone text,
  city text,
  preferred_language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_profiles_email_idx
  on public.customer_profiles (lower(email));

-- Shared updated_at trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.dealers') is not null then
    drop trigger if exists trg_dealers_updated_at on public.dealers;
    create trigger trg_dealers_updated_at
    before update on public.dealers
    for each row execute function public.set_updated_at();
  end if;

  if to_regclass('public.leads') is not null then
    drop trigger if exists trg_leads_updated_at on public.leads;
    create trigger trg_leads_updated_at
    before update on public.leads
    for each row execute function public.set_updated_at();
  end if;

  if to_regclass('public.exclusive_deals') is not null then
    drop trigger if exists trg_exclusive_deals_updated_at on public.exclusive_deals;
    create trigger trg_exclusive_deals_updated_at
    before update on public.exclusive_deals
    for each row execute function public.set_updated_at();
  end if;

  if to_regclass('public.customer_profiles') is not null then
    drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
    create trigger trg_customer_profiles_updated_at
    before update on public.customer_profiles
    for each row execute function public.set_updated_at();
  end if;
end $$;

commit;

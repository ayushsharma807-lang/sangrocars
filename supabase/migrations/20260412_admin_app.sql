-- Admin app schema updates
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text default 'admin',
  created_at timestamptz default now()
);

alter table public.listings
  add column if not exists listing_type text,
  add column if not exists seller_name text,
  add column if not exists seller_phone text,
  add column if not exists ownership text,
  add column if not exists exterior_color text,
  add column if not exists registration_year integer,
  add column if not exists registration_state text,
  add column if not exists insurance_status text,
  add column if not exists fitness_status text,
  add column if not exists featured boolean default false,
  add column if not exists cover_photo_url text,
  add column if not exists created_by uuid references auth.users,
  add column if not exists updated_at timestamptz;

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  photo_url text not null,
  sort_order integer default 0,
  is_cover boolean default false,
  created_at timestamptz default now()
);

alter table public.leads
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists source text,
  add column if not exists status text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz;

create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_make_idx on public.listings(make);
create index if not exists listing_photos_listing_idx on public.listing_photos(listing_id);
create index if not exists leads_status_idx on public.leads(status);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.leads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Profiles admin access'
  ) then
    create policy "Profiles admin access" on public.profiles
      for all
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'Listings admin access'
  ) then
    create policy "Listings admin access" on public.listings
      for all
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'listing_photos' and policyname = 'Listing photos admin access'
  ) then
    create policy "Listing photos admin access" on public.listing_photos
      for all
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'leads' and policyname = 'Leads admin access'
  ) then
    create policy "Leads admin access" on public.leads
      for all
      using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
      with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
  end if;
end $$;

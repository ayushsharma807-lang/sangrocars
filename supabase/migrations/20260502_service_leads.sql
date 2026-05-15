begin;

create table if not exists public.service_leads (
  id uuid primary key default gen_random_uuid(),
  service_type text not null check (
    service_type in ('finance', 'insurance', 'mutual_funds', 'properties', 'cars')
  ),
  name text not null,
  phone text not null,
  city text,
  message text,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'in_progress', 'completed', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create index if not exists service_leads_service_type_idx
  on public.service_leads(service_type);

create index if not exists service_leads_status_idx
  on public.service_leads(status);

create index if not exists service_leads_created_at_idx
  on public.service_leads(created_at desc);

alter table public.service_leads enable row level security;

drop policy if exists "Service leads public insert" on public.service_leads;
create policy "Service leads public insert"
on public.service_leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "Service leads admin read" on public.service_leads;
create policy "Service leads admin read"
on public.service_leads
for select
to authenticated
using (public.is_admin());

drop policy if exists "Service leads admin update" on public.service_leads;
create policy "Service leads admin update"
on public.service_leads
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Service leads admin delete" on public.service_leads;
create policy "Service leads admin delete"
on public.service_leads
for delete
to authenticated
using (public.is_admin());

commit;

begin;

-- Fix Security Advisor warning:
-- Function Search Path Mutable
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep RLS enabled on leads and remove any existing table policies.
-- The public website contact forms post to Next.js API routes, and those routes
-- insert with the service-role client in /src/app/api/leads/route.ts.
-- That means no anon/authenticated policy is required for the app to keep working.
alter table public.leads enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'leads'
  loop
    execute format('drop policy if exists %I on public.leads', pol.policyname);
  end loop;
end
$$;

commit;

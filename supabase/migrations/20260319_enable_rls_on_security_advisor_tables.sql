begin;

-- listings
-- Used by public website pages, but only through server-side service-role queries.
alter table public.listings enable row level security;

-- telegram_sessions
-- Internal bot session state, used only by the Telegram webhook.
alter table public.telegram_sessions enable row level security;

-- dealers
-- Read on public pages through server-side service-role helpers and used heavily by admin/dealer APIs.
alter table public.dealers enable row level security;

-- lead_audit
-- Internal audit trail only.
alter table public.lead_audit enable row level security;

-- staff
-- Internal admin assignment/support table only.
alter table public.staff enable row level security;

-- dealer_users
-- Internal dealer-auth mapping only.
alter table public.dealer_users enable row level security;

-- profiles
-- Internal staff/admin fallback table only.
alter table public.profiles enable row level security;

-- exclusive_deals
-- Read on public pages through server-side service-role helpers and managed via admin APIs.
alter table public.exclusive_deals enable row level security;

-- customer_profiles
-- Internal customer profile table, managed only by server-side auth helpers.
alter table public.customer_profiles enable row level security;

-- Intentionally no anon/authenticated policies are added here.
-- The current app reads/writes these tables through server-side code that uses
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS safely.
-- This keeps the minimum safe posture: direct browser access is denied by default.

commit;

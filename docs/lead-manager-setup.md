# Sangro Cars Lead Manager Setup

## 1. Environment variables
Add these to Vercel and your local `.env.local`:

```
LEAD_MANAGER_EMAIL=admin@sangrocars.in
LEAD_MANAGER_PASSWORD=your-strong-password
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 2. Database schema
Run the migration:

```
/Users/ayushsharma/carhub/supabase/migrations/20260323_lead_manager.sql
```

## 3. Seed data (optional)
Run:

```
/Users/ayushsharma/carhub/supabase/seed/lead_manager_seed.sql
```

## 4. Access the app
- Login page: `/lead-manager/login`
- Dashboard: `/lead-manager`
- Leads list: `/lead-manager/leads`
- Add lead: `/lead-manager/new`

## 5. Notes
- Lead Manager uses server-side Supabase service role access.
- RLS is enabled on `lead_manager_leads` with no public policies.
- Only logged-in admin users (via the lead manager cookie) can access pages.

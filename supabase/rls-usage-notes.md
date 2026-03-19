# Supabase RLS usage notes

This note documents the verified app usage for the Security Advisor tables that now have RLS enabled without adding public policies.

## Service-role access pattern

These queries are currently executed through the server-side helper in:

- `/Users/ayushsharma/carhub/src/lib/supabase.ts`

That helper uses `SUPABASE_SERVICE_ROLE_KEY`, so the app keeps working after RLS is enabled.

## Table usage

### `public.listings`

- Public website data is fetched server-side from:
  - `/Users/ayushsharma/carhub/src/lib/publicListings.ts`
  - `/Users/ayushsharma/carhub/src/app/listings/page.tsx`
  - `/Users/ayushsharma/carhub/src/app/listing/[id]/page.tsx`
- Admin/dealer writes happen through:
  - `/Users/ayushsharma/carhub/src/app/api/admin/listings/route.ts`
  - `/Users/ayushsharma/carhub/src/app/api/admin/listings/[id]/route.ts`
  - `/Users/ayushsharma/carhub/src/app/api/dealer/listings/route.ts`
  - `/Users/ayushsharma/carhub/src/app/api/dealer/listings/[id]/route.ts`

### `public.dealers`

- Public website lookups happen server-side from:
  - `/Users/ayushsharma/carhub/src/lib/publicListings.ts`
  - `/Users/ayushsharma/carhub/src/app/listing/[id]/page.tsx`
- Admin/dealer auth and management use:
  - `/Users/ayushsharma/carhub/src/lib/dealerAuth.ts`
  - `/Users/ayushsharma/carhub/src/app/admin/dealers/page.tsx`
  - `/Users/ayushsharma/carhub/src/app/api/admin/dealers/route.ts`

### `public.exclusive_deals`

- Public pages:
  - `/Users/ayushsharma/carhub/src/app/deals-of-the-week/page.tsx`
  - `/Users/ayushsharma/carhub/src/app/exclusive-deals/[id]/page.tsx`
- Admin management:
  - `/Users/ayushsharma/carhub/src/app/admin/exclusive-deals/page.tsx`
  - `/Users/ayushsharma/carhub/src/app/api/admin/exclusive-deals/route.ts`

### `public.telegram_sessions`

- Internal only:
  - `/Users/ayushsharma/carhub/src/app/api/telegram/webhook/route.ts`

### `public.lead_audit`

- Internal only:
  - `/Users/ayushsharma/carhub/src/lib/leadAudit.ts`

### `public.staff`

- Internal only:
  - `/Users/ayushsharma/carhub/src/lib/staff.ts`

### `public.profiles`

- Internal fallback only:
  - `/Users/ayushsharma/carhub/src/lib/staff.ts`

### `public.dealer_users`

- Internal dealer-auth mapping only:
  - `/Users/ayushsharma/carhub/src/lib/dealerAuth.ts`

### `public.customer_profiles`

- Internal customer profile sync only:
  - `/Users/ayushsharma/carhub/src/lib/customerAuth.ts`

### `public.leads`

- Public website forms submit to:
  - `/Users/ayushsharma/carhub/src/app/components/ContactForm.tsx`
  - `/Users/ayushsharma/carhub/src/app/listing/[id]/LeadForm.tsx`
- Those forms call the Next.js API route:
  - `/Users/ayushsharma/carhub/src/app/api/leads/route.ts`
- That API route inserts with the server-side service-role client:
  - `/Users/ayushsharma/carhub/src/lib/supabase.ts`
- Admin/dealer lead reads and updates are also server-side only:
  - `/Users/ayushsharma/carhub/src/app/admin/leads/page.tsx`
  - `/Users/ayushsharma/carhub/src/app/admin/leads/[id]/page.tsx`
  - `/Users/ayushsharma/carhub/src/app/dealer-admin/page.tsx`
  - `/Users/ayushsharma/carhub/src/app/dealer-admin/leads/page.tsx`
  - `/Users/ayushsharma/carhub/src/app/api/leads/[id]/route.ts`
  - `/Users/ayushsharma/carhub/src/app/api/leads/bulk/route.ts`
  - `/Users/ayushsharma/carhub/src/app/api/dealer/leads/[id]/route.ts`
  - `/Users/ayushsharma/carhub/src/app/api/dealer/leads/bulk/route.ts`

## Browser-side note

The browser Supabase client is currently used for storage/image upload flows, not direct reads from the tables above:

- `/Users/ayushsharma/carhub/src/lib/supabase-browser.ts`
- `/Users/ayushsharma/carhub/src/lib/clientCarImageUpload.ts`

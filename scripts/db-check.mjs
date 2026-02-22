#!/usr/bin/env node

const required = {
  dealers: [
    'id',
    'name',
    'phone',
    'whatsapp',
    'address',
    'feed_url',
    'email',
    'auth_user_id',
    'description',
    'logo_url',
    'inventory_url',
    'sitemap_url',
    'created_at',
  ],
  listings: [
    'id',
    'dealer_id',
    'source',
    'type',
    'status',
    'make',
    'model',
    'variant',
    'year',
    'price',
    'km',
    'fuel',
    'transmission',
    'location',
    'description',
    'photo_urls',
    'created_at',
    'updated_at',
  ],
  leads: [
    'id',
    'listing_id',
    'dealer_id',
    'name',
    'phone',
    'email',
    'message',
    'source',
    'listing_title',
    'status',
    'notes',
    'assigned_to',
    'created_at',
  ],
  lead_audit: ['id', 'lead_id', 'action', 'changes', 'actor_email', 'actor_id', 'created_at'],
  dealer_users: ['id', 'dealer_id', 'user_id', 'role', 'created_at'],
  exclusive_deals: [
    'id',
    'title',
    'dealer',
    'city',
    'price',
    'video_url',
    'embed_code',
    'tags',
    'highlights',
    'sort_order',
    'is_active',
    'created_at',
  ],
  staff: ['id', 'name', 'email'],
  profiles: ['id', 'full_name', 'email'],
  customer_profiles: ['id', 'email', 'full_name', 'phone', 'city', 'preferred_language'],
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const response = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
});

if (!response.ok) {
  console.error(`Failed to load Supabase schema: HTTP ${response.status}`);
  process.exit(1);
}

const spec = await response.json();
const definitions = spec?.definitions ?? {};

let ok = true;
for (const [table, columns] of Object.entries(required)) {
  const definition = definitions[table];
  if (!definition) {
    ok = false;
    console.log(`MISSING TABLE: ${table}`);
    continue;
  }

  const available = new Set(Object.keys(definition.properties ?? {}));
  const missingColumns = columns.filter((column) => !available.has(column));
  if (missingColumns.length > 0) {
    ok = false;
    console.log(`MISSING COLUMNS: ${table} -> ${missingColumns.join(', ')}`);
    continue;
  }

  console.log(`OK: ${table}`);
}

if (!ok) {
  console.log('\nRun /Users/ayushsharma/carhub/supabase/setup.sql in Supabase SQL Editor, then run this check again.');
  process.exit(2);
}

console.log('\nSchema check passed.');

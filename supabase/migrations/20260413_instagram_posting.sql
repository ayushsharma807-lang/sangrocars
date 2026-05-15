alter table public.listings
  add column if not exists instagram_post_status text,
  add column if not exists instagram_posted_at timestamptz,
  add column if not exists instagram_post_id text,
  add column if not exists instagram_caption text,
  add column if not exists instagram_scheduled_for timestamptz;

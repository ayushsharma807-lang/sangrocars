import { supabaseServer } from "@/lib/supabase";

type CleanupOptions = {
  soldAfterDays?: number;
  expireAfterDays?: number;
  dryRun?: boolean;
};

type ListingRow = {
  id: string;
  status: string | null;
  last_seen_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type CleanupResult = {
  checked: number;
  sold: number;
  expired: number;
  dryRun: boolean;
  soldAfterDays: number;
  expireAfterDays: number;
  notes: string[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_SOLD_AFTER_DAYS = Number(process.env.LISTING_SOLD_AFTER_DAYS ?? 45);
const DEFAULT_EXPIRE_AFTER_DAYS = Number(
  process.env.LISTING_EXPIRE_AFTER_DAYS ?? 90
);

const toTimestamp = (row: ListingRow) => {
  const source = row.last_seen_at || row.updated_at || row.created_at;
  if (!source) return null;
  const time = new Date(source).getTime();
  return Number.isFinite(time) ? time : null;
};

const chunk = <T>(arr: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const updateStatus = async (ids: string[], status: "sold" | "expired") => {
  if (ids.length === 0) {
    return { ok: true as const, error: null as string | null };
  }
  const sb = supabaseServer();
  for (const part of chunk(ids, 300)) {
    const { error } = await sb.from("listings").update({ status }).in("id", part);
    if (error) {
      return { ok: false as const, error: error.message };
    }
  }
  return { ok: true as const, error: null as string | null };
};

export const runListingLifecycleCleanup = async (
  options: CleanupOptions = {}
): Promise<CleanupResult> => {
  const soldAfterDays = Math.max(
    1,
    Number.isFinite(options.soldAfterDays ?? NaN)
      ? Number(options.soldAfterDays)
      : DEFAULT_SOLD_AFTER_DAYS
  );
  const expireAfterDays = Math.max(
    soldAfterDays + 1,
    Number.isFinite(options.expireAfterDays ?? NaN)
      ? Number(options.expireAfterDays)
      : DEFAULT_EXPIRE_AFTER_DAYS
  );
  const dryRun = Boolean(options.dryRun);
  const now = Date.now();
  const notes: string[] = [];

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("listings")
    .select("id, status, last_seen_at, updated_at, created_at")
    .eq("status", "available")
    .limit(10000);

  if (error) {
    return {
      checked: 0,
      sold: 0,
      expired: 0,
      dryRun,
      soldAfterDays,
      expireAfterDays,
      notes: [`failed_to_load_listings: ${error.message}`],
    };
  }

  const soldIds: string[] = [];
  const expiredIds: string[] = [];
  const rows = (data ?? []) as ListingRow[];

  for (const row of rows) {
    const ts = toTimestamp(row);
    if (!ts) continue;
    const ageDays = (now - ts) / MS_PER_DAY;
    if (ageDays >= expireAfterDays) {
      expiredIds.push(row.id);
      continue;
    }
    if (ageDays >= soldAfterDays) {
      soldIds.push(row.id);
    }
  }

  if (!dryRun) {
    let expiredToApply = expiredIds;
    const expiredResult = await updateStatus(expiredIds, "expired");
    if (!expiredResult.ok) {
      notes.push(`expired_update_failed: ${expiredResult.error}`);
      notes.push("fallback_to_sold_for_expired=true");
      expiredToApply = [];
      soldIds.push(...expiredIds);
    }

    const soldResult = await updateStatus(soldIds, "sold");
    if (!soldResult.ok) {
      notes.push(`sold_update_failed: ${soldResult.error}`);
    }

    if (expiredResult.ok) {
      notes.push(`expired_updated=${expiredToApply.length}`);
    }
  }

  return {
    checked: rows.length,
    sold: soldIds.length,
    expired: expiredIds.length,
    dryRun,
    soldAfterDays,
    expireAfterDays,
    notes,
  };
};

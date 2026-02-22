import { NextResponse } from "next/server";
import { runListingLifecycleCleanup } from "@/lib/listingLifecycle";

const MAINTENANCE_SECRET =
  process.env.LISTING_MAINTENANCE_SECRET ?? process.env.SYNC_SECRET ?? "";

const parseBoolean = (value?: string | null) =>
  value === "1" || value === "true" || value === "yes";

const parseNumber = (value?: string | null) => {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export async function POST(req: Request) {
  if (!MAINTENANCE_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "LISTING_MAINTENANCE_SECRET (or SYNC_SECRET) is not configured",
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const token =
    req.headers.get("x-maintenance-token") ||
    searchParams.get("token") ||
    req.headers.get("x-sync-token") ||
    "";

  if (token !== MAINTENANCE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const soldAfterDays = parseNumber(searchParams.get("sold_after_days"));
  const expireAfterDays = parseNumber(searchParams.get("expire_after_days"));
  const dryRun = parseBoolean(searchParams.get("dry_run"));

  const result = await runListingLifecycleCleanup({
    soldAfterDays: soldAfterDays ?? undefined,
    expireAfterDays: expireAfterDays ?? undefined,
    dryRun,
  });

  return NextResponse.json({ ok: true, ...result });
}

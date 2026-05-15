import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/servicesPortalAuth";
import { syncMutualFundNavs } from "@/lib/mutualFundNavSync";

function isCronAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

async function runSync() {
  const result = await syncMutualFundNavs();
  return NextResponse.json({
    ok: true,
    ...result,
    syncedAt: new Date().toISOString(),
    source: "AMFI NAVAll.txt",
  });
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    return await runSync();
  } catch (error) {
    const message = error instanceof Error ? error.message : "NAV sync failed.";
    console.error("[mutual-funds/sync-nav][GET]", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await hasPortalRole("admin");
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const response = await runSync();
    const acceptsHtml = (req.headers.get("accept") ?? "").includes("text/html");

    if (acceptsHtml) {
      const redirectTo = req.headers.get("referer") || "/services-admin";
      const url = new URL(redirectTo);
      url.searchParams.set("nav_sync", "success");
      return NextResponse.redirect(url);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "NAV sync failed.";
    console.error("[mutual-funds/sync-nav][POST]", error);

    const acceptsHtml = (req.headers.get("accept") ?? "").includes("text/html");
    if (acceptsHtml) {
      const redirectTo = req.headers.get("referer") || "/services-admin";
      const url = new URL(redirectTo);
      url.searchParams.set("nav_sync", "error");
      url.searchParams.set("message", message);
      return NextResponse.redirect(url);
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

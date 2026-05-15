import { NextResponse } from "next/server";
import { hasPortalRole } from "@/lib/servicesPortalAuth";
import { syncMutualFundNavs } from "@/lib/mutualFundNavSync";

export async function POST(req: Request) {
  const session = await hasPortalRole("admin");
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    await syncMutualFundNavs();
    const redirectTo = req.headers.get("referer") || "/services-admin";
    const url = new URL(redirectTo);
    url.searchParams.set("nav_sync", "success");
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "NAV sync failed.";
    console.error("[services/nav-refresh][POST]", error);
    const redirectTo = req.headers.get("referer") || "/services-admin";
    const url = new URL(redirectTo);
    url.searchParams.set("nav_sync", "error");
    url.searchParams.set("message", message);
    return NextResponse.redirect(url);
  }
}

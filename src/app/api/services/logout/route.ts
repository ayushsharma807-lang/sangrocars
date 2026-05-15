import { NextResponse } from "next/server";
import { portalCookieNames, servicesCookieOptions } from "@/lib/servicesPortalAuth";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const nextPath = String(form?.get("next") ?? "/services-portal/login");
  const response = NextResponse.redirect(new URL(nextPath, req.url));
  response.cookies.set(portalCookieNames.access, "", {
    ...servicesCookieOptions(0),
    expires: new Date(0),
  });
  response.cookies.set(portalCookieNames.refresh, "", {
    ...servicesCookieOptions(0),
    expires: new Date(0),
  });
  return response;
}

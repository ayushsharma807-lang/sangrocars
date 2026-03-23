import { NextResponse } from "next/server";
import { leadManagerCookieOptions } from "@/lib/leadManagerAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("lead_manager_admin", "", {
    ...leadManagerCookieOptions(),
    maxAge: 0,
  });
  return res;
}

import { NextResponse } from "next/server";
import { leadManagerCookieOptions } from "@/lib/leadManagerAuth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = body?.email ?? "";
  const password = body?.password ?? "";

  const allowedEmail = (process.env.LEAD_MANAGER_EMAIL ?? "").trim().toLowerCase();
  const allowedPassword = (process.env.LEAD_MANAGER_PASSWORD ?? "").trim();

  if (!allowedEmail || !allowedPassword) {
    return NextResponse.json(
      { ok: false, error: "Login is not configured." },
      { status: 500 }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (email.trim().toLowerCase() !== allowedEmail || password !== allowedPassword) {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("lead_manager_admin", "1", leadManagerCookieOptions());
  return res;
}

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "OTP login is disabled. Use email and password.",
    },
    { status: 410 }
  );
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/dealer-admin/login", req.url));
  response.cookies.set("sb-access-token", "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });
  response.cookies.set("sb-refresh-token", "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });
  return response;
}

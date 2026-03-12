import { NextResponse } from "next/server";

const COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export async function POST() {
  const response = NextResponse.json({ ok: true });

  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}

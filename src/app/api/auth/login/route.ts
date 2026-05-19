import { NextResponse } from "next/server";
import { createSessionToken, getPassword, SESSION_COOKIE_NAME, SESSION_DURATION_S } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const password = body?.password ?? "";
  let expected: string;
  try {
    expected = getPassword();
  } catch {
    return NextResponse.json({ error: "auth non configurée côté serveur" }, { status: 500 });
  }

  if (password !== expected) {
    // Léger délai pour limiter le bruteforce
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "mot de passe incorrect" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_S,
  });
  return res;
}

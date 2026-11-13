import { NextResponse } from "next/server";
import { adminCookieOptions, createAdminToken, isAdminConfigured, passwordMatches, ADMIN_COOKIE } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  let password: unknown;
  try { password = (await request.json()).password; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!passwordMatches(password)) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), adminCookieOptions);
  return response;
}
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return response;
}

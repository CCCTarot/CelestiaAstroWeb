import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "celestia_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;
function secret() { return process.env.CELESTIA_SESSION_SECRET || ""; }
function signature(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export function isAdminConfigured() { return Boolean(process.env.CELESTIA_ADMIN_PASSWORD && secret().length >= 32); }
export function passwordMatches(value: unknown) {
  const expected = process.env.CELESTIA_ADMIN_PASSWORD || "";
  if (!isAdminConfigured() || typeof value !== "string" || !value || value.length > 512) return false;
  const left = Buffer.from(value), right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function createAdminToken() {
  const payload = `${Date.now() + SESSION_SECONDS * 1000}`;
  return `${payload}.${signature(payload)}`;
}
export function isValidAdminToken(token: string | undefined) {
  if (!token || !isAdminConfigured()) return false;
  const [expires, supplied] = token.split(".");
  if (!expires || !supplied || !/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(signature(expires)), actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function hasAdminSession() {
  const jar = await cookies();
  return isValidAdminToken(jar.get(ADMIN_COOKIE)?.value);
}
export const adminCookieOptions = { httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS };

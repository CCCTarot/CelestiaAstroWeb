import { NextResponse } from "next/server";

export function shopCorsHeaders(origin: string | null) {
  const allowed = (process.env.SHOP_ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return null;
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600", Vary: "Origin" };
}
export function corsError(message: string, status: number, origin: string | null) {
  const headers = shopCorsHeaders(origin);
  return NextResponse.json({ error: message }, { status, headers: headers || undefined });
}

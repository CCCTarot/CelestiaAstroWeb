import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { corsError, shopCorsHeaders } from "@/lib/server/shop-cors";
import { supabaseRequest } from "@/lib/server/supabase";

export const runtime = "nodejs";
const categories = new Set(["western", "vedic", "both"]);
const text = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

export async function OPTIONS(request: Request) {
  const headers = shopCorsHeaders(request.headers.get("origin"));
  return headers ? new Response(null, { status: 204, headers }) : new Response(null, { status: 403 });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const cors = shopCorsHeaders(origin);
  if (origin && !cors) return corsError("This shop is not allowed to submit orders.", 403, origin);
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return corsError("JSON request body required.", 415, origin);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 100_000) return corsError("Order details are too large.", 413, origin);
    body = JSON.parse(raw);
  } catch { return corsError("Invalid JSON request body.", 400, origin); }

  const date = body.birthDate;
  const validDate = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  if (!text(body.customerName, 120) || !text(body.serviceTitle, 180) || typeof body.category !== "string" || !categories.has(body.category)
    || !validDate || !text(body.birthTime, 20) || typeof body.timeUnknown !== "boolean" || !text(body.birthPlace, 180)
    || !text(body.timezone, 80) || !body.chart || typeof body.chart !== "object" || Array.isArray(body.chart) || body.consent !== true) {
    return corsError("Please provide valid order details and consent to processing.", 400, origin);
  }
  const payload = {
    id: randomUUID(), customer_name: (body.customerName as string).trim(), service_title: (body.serviceTitle as string).trim(),
    category: body.category, birth_date: date, birth_time: (body.birthTime as string).trim(), time_unknown: body.timeUnknown,
    birth_place: (body.birthPlace as string).trim(), timezone: (body.timezone as string).trim(), chart: body.chart,
    consent_at: new Date().toISOString(),
  };
  try {
    const response = await supabaseRequest("celestia_orders", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
    if (!response.ok) {
      console.error("Order storage rejected submission", response.status);
      return corsError("Order submission could not be saved. Please try again later.", 502, origin);
    }
    return NextResponse.json({ id: payload.id }, { status: 201, headers: cors ?? undefined });
  } catch (error) {
    console.error("Order storage unavailable", error instanceof Error ? error.message : "unknown error");
    return corsError("Order submission is temporarily unavailable.", 503, origin);
  }
}

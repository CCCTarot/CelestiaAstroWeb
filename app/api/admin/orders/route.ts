import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/admin-session";
import { supabaseRequest } from "@/lib/server/supabase";

export const runtime = "nodejs";
export async function GET() {
  if (!await hasAdminSession()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const response = await supabaseRequest("celestia_orders?select=id,created_at,customer_name,service_title,category,birth_date,birth_time,time_unknown,birth_place,timezone,chart,consent_at&order=created_at.desc&limit=200");
    if (!response.ok) return NextResponse.json({ error: "Could not load orders." }, { status: 502 });
    return NextResponse.json({ orders: await response.json() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Order storage is not configured or unavailable." }, { status: 503 }); }
}

const endpoint = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function supabaseRequest(path: string, init: RequestInit = {}) {
  const base = endpoint(), serviceKey = key();
  if (!base || !serviceKey) throw new Error("Order storage is not configured.");
  return fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
}

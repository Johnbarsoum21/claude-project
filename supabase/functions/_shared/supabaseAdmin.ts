import { createClient } from "jsr:@supabase/supabase-js@2";

// Service-role client for Edge Functions only. SUPABASE_SERVICE_ROLE_KEY is
// a secret set via `supabase secrets set` -- it is never exposed to the app.
export function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY server env vars");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** Verifies the caller's JWT (from the Authorization header) and returns their user id. */
export async function requireUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Error("Missing Authorization bearer token");

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY server env vars");

  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user) throw new Error("Invalid or expired session");
  return data.user.id;
}

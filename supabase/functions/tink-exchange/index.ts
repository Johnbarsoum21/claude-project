// Exchanges a Tink Link authorization code for tokens, server-side.
// The Tink client_secret never leaves this function.
//
// POST body: { "code": "<authorization code from Tink Link redirect>", "credentialsId"?: string }
// Header: Authorization: Bearer <supabase user access token>
//
// Self-contained (no cross-function imports) so it can be pasted directly
// into the Supabase Dashboard's Edge Function editor. If you switch to
// CLI deploys later, this duplication could be factored back out into a
// _shared/ folder.

import { createClient } from "jsr:@supabase/supabase-js@2";

const TINK_API_BASE = "https://api.tink.com";

function requireServerEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required server env var: ${name}`);
  return v;
}

async function exchangeAuthorizationCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: requireServerEnv("TINK_CLIENT_ID"),
    client_secret: requireServerEnv("TINK_CLIENT_SECRET"),
    grant_type: "authorization_code",
  });

  const res = await fetch(`${TINK_API_BASE}/api/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Tink token exchange failed (${res.status}): ${await res.text()}`);
  return res.json();
}

function supabaseAdmin() {
  const url = requireServerEnv("SUPABASE_URL");
  const serviceKey = requireServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function requireUserId(req: Request): Promise<string> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Error("Missing Authorization bearer token");
  const client = createClient(requireServerEnv("SUPABASE_URL"), requireServerEnv("SUPABASE_ANON_KEY"));
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user) throw new Error("Invalid or expired session");
  return data.user.id;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const userId = await requireUserId(req);
    const { code, credentialsId } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing 'code'" }), { status: 400 });
    }

    const tokens = await exchangeAuthorizationCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const admin = supabaseAdmin();

    const { error: tokenErr } = await admin.from("tink_tokens").upsert(
      {
        created_by_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? "",
        expires_at: expiresAt,
        scope: tokens.scope,
      },
      { onConflict: "created_by_id" }
    );
    if (tokenErr) throw tokenErr;

    const { error: connErr } = await admin.from("tink_connections").upsert(
      {
        created_by_id: userId,
        provider_name: "bank",
        external_account_id: credentialsId ?? "unknown",
        connected_at: new Date().toISOString(),
      },
      { onConflict: "created_by_id" }
    );
    if (connErr) throw connErr;

    const { error: profileErr } = await admin
      .from("user_profiles")
      .update({ tink_connected: true })
      .eq("created_by_id", userId);
    if (profileErr) throw profileErr;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("tink-exchange error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

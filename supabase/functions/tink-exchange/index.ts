// Exchanges a Tink Link authorization code for tokens, server-side.
// The Tink client_secret never leaves this function.
//
// POST body: { "code": "<authorization code from Tink Link redirect>" }
// Header: Authorization: Bearer <supabase user access token>

import { exchangeAuthorizationCode } from "../_shared/tink.ts";
import { requireUserId, supabaseAdmin } from "../_shared/supabaseAdmin.ts";

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

    const { error: tokenErr } = await admin
      .from("tink_tokens")
      .upsert(
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

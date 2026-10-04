// Pulls new transactions from Tink for the calling user and upserts them
// into `expenses`. Call this from a scheduled job (nightly) or on
// pull-to-refresh in the app.
//
// Header: Authorization: Bearer <supabase user access token>
//
// Self-contained (no cross-function imports) so it can be pasted directly
// into the Supabase Dashboard's Edge Function editor.

import { createClient } from "jsr:@supabase/supabase-js@2";

const TINK_API_BASE = "https://api.tink.com";

function requireServerEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required server env var: ${name}`);
  return v;
}

async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: requireServerEnv("TINK_CLIENT_ID"),
    client_secret: requireServerEnv("TINK_CLIENT_SECRET"),
    grant_type: "refresh_token",
  });
  const res = await fetch(`${TINK_API_BASE}/api/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Tink token refresh failed (${res.status}): ${await res.text()}`);
  return res.json();
}

interface TinkTransaction {
  id: string;
  amount: { value: { scale: string; unscaledValue: string } };
  dates: { booked?: string; value?: string };
  descriptions: { original?: string; display?: string };
  categories?: { pfm?: { name?: string } };
  types?: { type?: string };
}

async function listTransactions(accessToken: string, pageToken?: string) {
  const url = new URL(`${TINK_API_BASE}/data/v2/transactions`);
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Tink list transactions failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return { transactions: (data.transactions ?? []) as TinkTransaction[], nextPageToken: data.nextPageToken as string | undefined };
}

function tinkAmountToNumber(tx: TinkTransaction): number {
  const { unscaledValue, scale } = tx.amount.value;
  return Number(unscaledValue) / Math.pow(10, Number(scale));
}

const PFM_TO_CATEGORY: Record<string, string> = {
  groceries: "food",
  restaurants: "food",
  food: "food",
  "eating-out": "going_out",
  transport: "transport",
  "public-transport": "transport",
  fuel: "transport",
  shopping: "shopping",
  clothing: "shopping",
  entertainment: "going_out",
  "coffee-shops": "coffee",
  cafe: "coffee",
  health: "health",
  pharmacy: "health",
  subscriptions: "subscriptions",
  "tv-media": "subscriptions",
  "cash-withdrawal": "cash",
  atm: "cash",
};

function mapTinkCategory(tx: TinkTransaction): string {
  const pfm = tx.categories?.pfm?.name?.toLowerCase();
  if (pfm && PFM_TO_CATEGORY[pfm]) return PFM_TO_CATEGORY[pfm];
  if (tx.types?.type === "WITHDRAWAL") return "cash";
  return "other";
}

function supabaseAdmin() {
  return createClient(requireServerEnv("SUPABASE_URL"), requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
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
  try {
    const userId = await requireUserId(req);
    const admin = supabaseAdmin();

    const { data: tokenRow, error: tokenErr } = await admin
      .from("tink_tokens")
      .select("*")
      .eq("created_by_id", userId)
      .single();
    if (tokenErr || !tokenRow) {
      return new Response(JSON.stringify({ error: "No Tink connection for this user" }), { status: 404 });
    }

    let accessToken = tokenRow.access_token;
    const expiresAt = new Date(tokenRow.expires_at).getTime();
    if (Date.now() > expiresAt - 60_000) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token);
      accessToken = refreshed.access_token;
      await admin
        .from("tink_tokens")
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token ?? tokenRow.refresh_token,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq("created_by_id", userId);
    }

    let pageToken: string | undefined = tokenRow.transactions_cursor ?? undefined;
    let imported = 0;
    let nextPageToken: string | undefined;

    do {
      const page = await listTransactions(accessToken, pageToken);
      nextPageToken = page.nextPageToken;

      for (const tx of page.transactions) {
        const amount = Math.abs(tinkAmountToNumber(tx));
        const category = mapTinkCategory(tx);
        const date = (tx.dates.booked ?? tx.dates.value ?? new Date().toISOString()).slice(0, 10);

        const { error } = await admin.from("expenses").upsert(
          {
            created_by_id: userId,
            amount,
            category,
            description: tx.descriptions.display ?? tx.descriptions.original ?? null,
            date,
            is_cash: category === "cash",
            source: "tink",
            tink_transaction_id: tx.id,
          },
          { onConflict: "tink_transaction_id" }
        );
        if (!error) imported++;
      }

      pageToken = nextPageToken;
    } while (nextPageToken);

    await admin.from("tink_tokens").update({ transactions_cursor: nextPageToken ?? null }).eq("created_by_id", userId);
    await admin.from("tink_connections").update({ last_synced_at: new Date().toISOString() }).eq("created_by_id", userId);

    return new Response(JSON.stringify({ ok: true, imported }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("tink-sync error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

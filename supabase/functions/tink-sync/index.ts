// Pulls new transactions from Tink for the calling user and upserts them
// into `expenses`. Call this from a scheduled Supabase cron (nightly, per
// the spec's "processed automatically overnight") or on pull-to-refresh.
//
// Header: Authorization: Bearer <supabase user access token>

import { listTransactions, mapTinkCategory, refreshAccessToken, tinkAmountToNumber } from "../_shared/tink.ts";
import { requireUserId, supabaseAdmin } from "../_shared/supabaseAdmin.ts";

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

    let pageToken = tokenRow.transactions_cursor ?? undefined;
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

    await admin
      .from("tink_tokens")
      .update({ transactions_cursor: nextPageToken ?? null })
      .eq("created_by_id", userId);
    await admin
      .from("tink_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("created_by_id", userId);

    return new Response(JSON.stringify({ ok: true, imported }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("tink-sync error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

import * as WebBrowser from "expo-web-browser";
import { env } from "@/config/env";
import { supabase } from "@/lib/supabase";

// Tink Link hosted flow (https://docs.tink.com/resources/getting-started/tink-link-overview).
// Only the client_id (not secret) is used here -- the authorization `code`
// this returns is exchanged for tokens server-side in the tink-exchange
// Edge Function, where the client_secret actually lives.
function buildAuthorizeUrl(state: string) {
  const url = new URL("https://link.tink.com/1.0/authorize/");
  url.searchParams.set("client_id", env.tinkClientId);
  url.searchParams.set("redirect_uri", env.tinkRedirectUri);
  url.searchParams.set("market", "NL");
  url.searchParams.set("locale", "en_US");
  url.searchParams.set("scope", "accounts:read,balances:read,transactions:read,provider-consents:read");
  url.searchParams.set("state", state);
  return url.toString();
}

export type ConnectBankResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export async function connectBank(): Promise<ConnectBankResult> {
  if (!env.tinkClientId) {
    return { status: "error", message: "Tink client ID is not configured." };
  }

  const state = Math.random().toString(36).slice(2);
  const authorizeUrl = buildAuthorizeUrl(state);

  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, env.tinkRedirectUri);

  if (result.type !== "success" || !result.url) {
    return { status: "cancelled" };
  }

  const redirected = new URL(result.url);
  const code = redirected.searchParams.get("code");
  const credentialsId = redirected.searchParams.get("credentials_id") ?? undefined;
  const returnedState = redirected.searchParams.get("state");
  const errorParam = redirected.searchParams.get("error");

  if (errorParam) {
    return { status: "error", message: errorParam };
  }
  if (!code || returnedState !== state) {
    return { status: "error", message: "Tink did not return a valid authorization code." };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return { status: "error", message: "You must be signed in to connect a bank." };
  }
  if (!env.apiBaseUrl) {
    return { status: "error", message: "Backend API base URL is not configured." };
  }

  const res = await fetch(`${env.apiBaseUrl}/tink-exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ code, credentialsId }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { status: "error", message: `Exchange failed: ${text}` };
  }

  return { status: "success" };
}

export async function syncBankTransactions(): Promise<{ ok: boolean; imported?: number; error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken || !env.apiBaseUrl) {
    return { ok: false, error: "Not signed in or API base URL missing." };
  }

  const res = await fetch(`${env.apiBaseUrl}/tink-sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return { ok: false, error: await res.text() };
  }
  return res.json();
}

import Constants from "expo-constants";

// Public, client-safe config only. Never put a secret (Tink client_secret,
// Supabase service_role key, Claude API key) in here — those live only in
// the backend (Supabase Edge Functions) and are read from process.env there.
//
// Values are injected via app.config.ts -> extra, which in turn reads from
// environment variables set in the project's environment settings (not
// hardcoded, never committed).
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const env = {
  supabaseUrl: extra.supabaseUrl ?? "",
  supabaseAnonKey: extra.supabaseAnonKey ?? "",
  tinkClientId: extra.tinkClientId ?? "",
  tinkRedirectUri: extra.tinkRedirectUri ?? "financialhub://tink-callback",
  // Base URL of the backend that hosts the Tink token-exchange Edge Function.
  apiBaseUrl: extra.apiBaseUrl ?? "",
};

export function assertEnv(keys: Array<keyof typeof env>) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    console.warn(`[env] Missing config: ${missing.join(", ")}. Set these in app.config.ts / environment variables.`);
  }
}

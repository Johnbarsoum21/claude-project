// Shared Tink API helpers for Edge Functions.
// Docs: https://docs.tink.com -- double check exact endpoint paths/scopes
// against your Tink console configuration (sandbox vs certified access
// differ in which markets/scopes are available).

const TINK_API_BASE = "https://api.tink.com";

export interface TinkTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required server env var: ${name}`);
  return v;
}

export function tinkClientId(): string {
  return requireEnv("TINK_CLIENT_ID");
}

function tinkClientSecret(): string {
  return requireEnv("TINK_CLIENT_SECRET");
}

/** Exchanges a Tink Link authorization `code` for access + refresh tokens. */
export async function exchangeAuthorizationCode(code: string): Promise<TinkTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: tinkClientId(),
    client_secret: tinkClientSecret(),
    grant_type: "authorization_code",
  });

  const res = await fetch(`${TINK_API_BASE}/api/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tink token exchange failed (${res.status}): ${text}`);
  }
  return res.json();
}

/** Uses a stored refresh_token to obtain a fresh access_token. */
export async function refreshAccessToken(refreshToken: string): Promise<TinkTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: tinkClientId(),
    client_secret: tinkClientSecret(),
    grant_type: "refresh_token",
  });

  const res = await fetch(`${TINK_API_BASE}/api/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tink token refresh failed (${res.status}): ${text}`);
  }
  return res.json();
}

export interface TinkTransaction {
  id: string;
  accountId: string;
  amount: { value: { scale: string; unscaledValue: string }; currencyCode: string };
  dates: { booked?: string; value?: string };
  descriptions: { original?: string; display?: string };
  categories?: { pfm?: { id?: string; name?: string } };
  types?: { type?: string }; // e.g. "DEFAULT", "TRANSFER", "WITHDRAWAL"
  status?: string;
}

export async function listTransactions(
  accessToken: string,
  pageToken?: string
): Promise<{ transactions: TinkTransaction[]; nextPageToken?: string }> {
  const url = new URL(`${TINK_API_BASE}/data/v2/transactions`);
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tink list transactions failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { transactions: data.transactions ?? [], nextPageToken: data.nextPageToken };
}

export function tinkAmountToNumber(tx: TinkTransaction): number {
  const { unscaledValue, scale } = tx.amount.value;
  return Number(unscaledValue) / Math.pow(10, Number(scale));
}

/** Rough mapping from Tink's PFM category names to our app's category enum. */
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

export function mapTinkCategory(tx: TinkTransaction): string {
  const pfm = tx.categories?.pfm?.name?.toLowerCase();
  if (pfm && PFM_TO_CATEGORY[pfm]) return PFM_TO_CATEGORY[pfm];
  if (tx.types?.type === "WITHDRAWAL") return "cash";
  return "other";
}

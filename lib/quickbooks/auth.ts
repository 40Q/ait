import { SupabaseClient } from "@supabase/supabase-js";

// QuickBooks OAuth configuration
export const QB_CONFIG = {
  clientId: process.env.QUICKBOOKS_CLIENT_ID!,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
  environment: (process.env.QUICKBOOKS_ENVIRONMENT || "sandbox") as "sandbox" | "production",
  webhookVerifierToken: process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN,
};

// OAuth endpoints
const OAUTH_ENDPOINTS = {
  sandbox: {
    authorize: "https://appcenter.intuit.com/connect/oauth2",
    token: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
  },
  production: {
    authorize: "https://appcenter.intuit.com/connect/oauth2",
    token: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
  },
};

export interface QuickBooksTokens {
  id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Generate the QuickBooks OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const endpoint = OAUTH_ENDPOINTS[QB_CONFIG.environment].authorize;
  const params = new URLSearchParams({
    client_id: QB_CONFIG.clientId,
    redirect_uri: QB_CONFIG.redirectUri,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    state,
  });

  console.log("QuickBooks redirect_uri:", QB_CONFIG.redirectUri);
  console.log("QuickBooks auth URL:", `${endpoint}?${params.toString()}`);

  return `${endpoint}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  realm_id?: string;
}> {
  const endpoint = OAUTH_ENDPOINTS[QB_CONFIG.environment].token;
  const credentials = Buffer.from(
    `${QB_CONFIG.clientId}:${QB_CONFIG.clientSecret}`
  ).toString("base64");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: QB_CONFIG.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
}> {
  const endpoint = OAUTH_ENDPOINTS[QB_CONFIG.environment].token;
  const credentials = Buffer.from(
    `${QB_CONFIG.clientId}:${QB_CONFIG.clientSecret}`
  ).toString("base64");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

/**
 * Store tokens in the database
 */
export async function storeTokens(
  supabase: SupabaseClient,
  realmId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  refreshTokenExpiresIn: number
): Promise<void> {
  const now = new Date();
  const accessTokenExpiresAt = new Date(now.getTime() + expiresIn * 1000);
  const refreshTokenExpiresAt = new Date(
    now.getTime() + refreshTokenExpiresIn * 1000
  );

  const { error } = await supabase.from("quickbooks_tokens").upsert(
    {
      realm_id: realmId,
      access_token: accessToken,
      refresh_token: refreshToken,
      access_token_expires_at: accessTokenExpiresAt.toISOString(),
      refresh_token_expires_at: refreshTokenExpiresAt.toISOString(),
    },
    { onConflict: "realm_id" }
  );

  if (error) {
    throw new Error(`Failed to store tokens: ${error.message}`);
  }
}

/**
 * Get stored tokens from the database
 */
export async function getStoredTokens(
  supabase: SupabaseClient
): Promise<QuickBooksTokens | null> {
  const { data, error } = await supabase
    .from("quickbooks_tokens")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows
    throw new Error(`Failed to get tokens: ${error.message}`);
  }

  return data as QuickBooksTokens;
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  supabase: SupabaseClient
): Promise<{ accessToken: string; realmId: string } | null> {
  const tokens = await getStoredTokens(supabase);
  if (!tokens) return null;

  const now = new Date();
  const accessTokenExpiry = new Date(tokens.access_token_expires_at);
  const refreshTokenExpiry = new Date(tokens.refresh_token_expires_at);

  // Check if refresh token is expired
  if (refreshTokenExpiry < now) {
    // Need to re-authorize
    await deleteTokens(supabase);
    return null;
  }

  // Check if access token is expired or about to expire (5 min buffer)
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  if (accessTokenExpiry.getTime() - bufferTime < now.getTime()) {
    // Refresh the token
    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);
      await storeTokens(
        supabase,
        tokens.realm_id,
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_in,
        newTokens.x_refresh_token_expires_in
      );
      return { accessToken: newTokens.access_token, realmId: tokens.realm_id };
    } catch {
      // Refresh failed, need to re-authorize
      await deleteTokens(supabase);
      return null;
    }
  }

  return { accessToken: tokens.access_token, realmId: tokens.realm_id };
}

/**
 * Delete tokens from the database
 */
export async function deleteTokens(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.from("quickbooks_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw new Error(`Failed to delete tokens: ${error.message}`);
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!QB_CONFIG.webhookVerifierToken) {
    console.warn("No webhook verifier token configured");
    return false;
  }

  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha256", QB_CONFIG.webhookVerifierToken)
    .update(payload)
    .digest("base64");

  return hash === signature;
}

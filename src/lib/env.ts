export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  shopifyApiKey: process.env.SHOPIFY_API_KEY ?? "",
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET ?? "",
  shopifyWebhookSecret:
    process.env.SHOPIFY_WEBHOOK_SECRET ?? process.env.SHOPIFY_API_SECRET ?? "",
  shopifyScopes:
    process.env.SHOPIFY_SCOPES ??
    "read_products,read_content,read_discounts,write_discounts,read_orders",
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION ?? "2025-10",
  shopifyTokenEncryptionKey: process.env.SHOPIFY_TOKEN_ENCRYPTION_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail:
    process.env.RESEND_FROM_EMAIL ?? "Affinity <notifications@affinityhq.com>",
};

export function isSupabaseConfigured() {
  return Boolean(
    env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey,
  );
}

export function isResendConfigured() {
  return Boolean(env.resendApiKey);
}

export function isShopifyConfigured() {
  return Boolean(
    env.shopifyApiKey &&
      env.shopifyApiSecret &&
      env.shopifyWebhookSecret &&
      env.shopifyTokenEncryptionKey &&
      isSupabaseConfigured(),
  );
}

export function isDemoMode() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") {
    return false;
  }

  return !isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function assertSupabaseConfiguration(feature: string) {
  if (isDemoMode()) {
    return;
  }

  if (isSupabaseConfigured()) {
    return;
  }

  throw new Error(
    `${feature} richiede NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY quando NEXT_PUBLIC_DEMO_MODE=false.`,
  );
}

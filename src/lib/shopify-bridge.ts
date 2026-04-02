import crypto from "node:crypto";

import { SHOPIFY_SCOPE_VALUES } from "@/lib/constants";
import { env, isShopifyConfigured } from "@/lib/env";
import {
  evaluateStoreConnectionHealth,
  getStoreSyncSource,
} from "@/lib/shopify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  StoreCatalogItem,
  StoreConnection,
  StoreSyncJob,
  StoreSyncJobInput,
  WebhookIngestionRecord,
  WebhookProcessingStatus,
} from "@/lib/types";

type JsonRecord = Record<string, string | number | boolean | null>;

const SHOPIFY_COOKIE_STATE = "affinity_shopify_state";

function getTokenKey() {
  return crypto
    .createHash("sha256")
    .update(env.shopifyTokenEncryptionKey)
    .digest();
}

function base64UrlEncode(value: Buffer) {
  return value.toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url");
}

export function getShopifyStateCookieName() {
  return SHOPIFY_COOKIE_STATE;
}

export function isValidShopifyShopDomain(value: string) {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(value.trim().toLowerCase());
}

export function normalizeShopifyShopDomain(value: string) {
  return value.trim().toLowerCase();
}

export function getShopifyScopes() {
  return Array.from(
    new Set(
      env.shopifyScopes
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean),
    ),
  );
}

export function getRequiredShopifyScopes() {
  return Array.from(new Set([...SHOPIFY_SCOPE_VALUES, ...getShopifyScopes()]));
}

export function buildShopifyCallbackUrl() {
  return new URL("/api/shopify/callback", env.appUrl).toString();
}

export function buildShopifyInstallUrl(shop: string, state: string) {
  const installUrl = new URL(`https://${normalizeShopifyShopDomain(shop)}/admin/oauth/authorize`);
  installUrl.searchParams.set("client_id", env.shopifyApiKey);
  installUrl.searchParams.set("scope", getRequiredShopifyScopes().join(","));
  installUrl.searchParams.set("redirect_uri", buildShopifyCallbackUrl());
  installUrl.searchParams.set("state", state);
  return installUrl.toString();
}

function createCallbackMessage(searchParams: URLSearchParams) {
  return Array.from(searchParams.entries())
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyShopifyCallbackHmac(searchParams: URLSearchParams) {
  const provided = searchParams.get("hmac");

  if (!provided) {
    return false;
  }

  const message = createCallbackMessage(searchParams);
  const digest = crypto
    .createHmac("sha256", env.shopifyApiSecret)
    .update(message)
    .digest("hex");

  return safeCompare(digest, provided);
}

export function verifyShopifyWebhookHmac(rawBody: string, hmacHeader: string | null) {
  if (!hmacHeader) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", env.shopifyWebhookSecret)
    .update(rawBody, "utf8")
    .digest("base64");

  return safeCompare(digest, hmacHeader);
}

export function encryptShopifyAccessToken(accessToken: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getTokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(accessToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [base64UrlEncode(iv), base64UrlEncode(authTag), base64UrlEncode(encrypted)].join(".");
}

export function decryptShopifyAccessToken(value: string) {
  const [ivValue, authTagValue, encryptedValue] = value.split(".");

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Il token Shopify salvato non e valido.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getTokenKey(),
    base64UrlDecode(ivValue),
  );
  decipher.setAuthTag(base64UrlDecode(authTagValue));

  const decrypted = Buffer.concat([
    decipher.update(base64UrlDecode(encryptedValue)),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

async function shopifyGraphql<T>(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
) {
  const response = await fetch(
    `https://${normalizeShopifyShopDomain(shopDomain)}/admin/api/${env.shopifyApiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).join(", ") ??
        "Shopify GraphQL request failed.",
    );
  }

  if (!payload.data) {
    throw new Error("La risposta GraphQL di Shopify non contiene dati.");
  }

  return payload.data;
}

export async function exchangeShopifyCodeForToken(shopDomain: string, code: string) {
  const response = await fetch(
    `https://${normalizeShopifyShopDomain(shopDomain)}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.shopifyApiKey,
        client_secret: env.shopifyApiSecret,
        code,
      }),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "Shopify token exchange failed.");
  }

  return {
    accessToken: payload.access_token,
    grantedScopes: payload.scope
      ? payload.scope.split(",").map((scope) => scope.trim()).filter(Boolean)
      : getRequiredShopifyScopes(),
  };
}

export async function fetchShopifyShopIdentity(shopDomain: string, accessToken: string) {
  const data = await shopifyGraphql<{
    shop: {
      name: string;
      primaryDomain: { url: string; host: string } | null;
    };
  }>(
    shopDomain,
    accessToken,
    `
      query ShopIdentity {
        shop {
          name
          primaryDomain {
            url
            host
          }
        }
      }
    `,
  );

  return {
    storeName: data.shop.name,
    storefrontUrl:
      data.shop.primaryDomain?.url ?? `https://${normalizeShopifyShopDomain(shopDomain)}`,
    shopDomain: data.shop.primaryDomain?.host ?? normalizeShopifyShopDomain(shopDomain),
  };
}

export async function fetchShopifyCatalogSnapshot(
  shopDomain: string,
  accessToken: string,
) {
  const data = await shopifyGraphql<{
    products: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string | null;
        onlineStoreUrl: string | null;
        updatedAt: string | null;
      }>;
    };
    collections: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string | null;
        onlineStoreUrl: string | null;
        updatedAt: string | null;
      }>;
    };
    pages: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string | null;
        updatedAt: string | null;
      }>;
    };
  }>(
    shopDomain,
    accessToken,
    `
      query CatalogSnapshot {
        products(first: 25) {
          nodes {
            id
            title
            handle
            onlineStoreUrl
            updatedAt
          }
        }
        collections(first: 25) {
          nodes {
            id
            title
            handle
            onlineStoreUrl
            updatedAt
          }
        }
        pages(first: 25) {
          nodes {
            id
            title
            handle
            updatedAt
          }
        }
      }
    `,
  );

  const items: Array<Omit<StoreCatalogItem, "id" | "createdAt" | "updatedAt"> & {
    rawPayload: Record<string, unknown>;
    sourceUpdatedAt: string | null;
  }> = [];

  data.products.nodes.forEach((item) => {
    items.push({
      shopifyResourceId: item.id,
      title: item.title,
      type: "product",
      handle: item.handle,
      destinationUrl:
        item.onlineStoreUrl ??
        `https://${normalizeShopifyShopDomain(shopDomain)}/products/${item.handle ?? ""}`,
      isAffiliateEnabled: true,
      isFeatured: false,
      rawPayload: item,
      sourceUpdatedAt: item.updatedAt,
    });
  });

  data.collections.nodes.forEach((item) => {
    items.push({
      shopifyResourceId: item.id,
      title: item.title,
      type: "collection",
      handle: item.handle,
      destinationUrl:
        item.onlineStoreUrl ??
        `https://${normalizeShopifyShopDomain(shopDomain)}/collections/${item.handle ?? ""}`,
      isAffiliateEnabled: true,
      isFeatured: false,
      rawPayload: item,
      sourceUpdatedAt: item.updatedAt,
    });
  });

  data.pages.nodes.forEach((item) => {
    items.push({
      shopifyResourceId: item.id,
      title: item.title,
      type: "page",
      handle: item.handle,
      destinationUrl: `https://${normalizeShopifyShopDomain(shopDomain)}/pages/${item.handle ?? ""}`,
      isAffiliateEnabled: true,
      isFeatured: false,
      rawPayload: item,
      sourceUpdatedAt: item.updatedAt,
    });
  });

  return items;
}

function mapStoreConnectionRow(row: Record<string, unknown>): StoreConnection {
  return {
    id: String(row.id),
    platform: "shopify",
    storeName: String(row.store_name),
    shopDomain: String(row.shop_domain),
    storefrontUrl: String(row.storefront_url),
    defaultDestinationUrl: String(row.default_destination_url),
    installState: String(row.install_state) as StoreConnection["installState"],
    status: String(row.status) as StoreConnection["status"],
    connectionHealth: String(row.connection_health) as StoreConnection["connectionHealth"],
    syncProductsEnabled:
      row.sync_products_enabled === undefined ? true : Boolean(row.sync_products_enabled),
    syncDiscountCodesEnabled:
      row.sync_discount_codes_enabled === undefined
        ? true
        : Boolean(row.sync_discount_codes_enabled),
    orderAttributionEnabled:
      row.order_attribution_enabled === undefined
        ? true
        : Boolean(row.order_attribution_enabled),
    autoCreateDiscountCodes:
      row.auto_create_discount_codes === undefined
        ? true
        : Boolean(row.auto_create_discount_codes),
    appEmbedEnabled:
      row.app_embed_enabled === undefined ? false : Boolean(row.app_embed_enabled),
    requiredScopes: Array.isArray(row.required_scopes) ? row.required_scopes.map(String) : [],
    grantedScopes: Array.isArray(row.granted_scopes) ? row.granted_scopes.map(String) : [],
    installedAt: row.installed_at ? String(row.installed_at) : null,
    connectedAt: row.connected_at ? String(row.connected_at) : null,
    lastHealthCheckAt: row.last_health_check_at ? String(row.last_health_check_at) : null,
    lastHealthError: row.last_health_error ? String(row.last_health_error) : null,
    lastProductsSyncAt: row.last_products_sync_at ? String(row.last_products_sync_at) : null,
    lastDiscountSyncAt: row.last_discount_sync_at ? String(row.last_discount_sync_at) : null,
    lastOrdersSyncAt: row.last_orders_sync_at ? String(row.last_orders_sync_at) : null,
    lastWebhookAt: row.last_webhook_at ? String(row.last_webhook_at) : null,
    productsSyncedCount:
      row.products_synced_count === undefined ? 0 : Number(row.products_synced_count),
    collectionsSyncedCount:
      row.collections_synced_count === undefined ? 0 : Number(row.collections_synced_count),
    discountsSyncedCount:
      row.discounts_synced_count === undefined ? 0 : Number(row.discounts_synced_count),
    updatedAt: String(row.updated_at),
  };
}

function mapStoreCatalogItemRow(row: Record<string, unknown>): StoreCatalogItem {
  return {
    id: String(row.id),
    shopifyResourceId: row.shopify_resource_id ? String(row.shopify_resource_id) : null,
    title: String(row.title),
    type: String(row.type) as StoreCatalogItem["type"],
    handle: row.handle ? String(row.handle) : null,
    destinationUrl: String(row.destination_url),
    isAffiliateEnabled:
      row.is_affiliate_enabled === undefined ? true : Boolean(row.is_affiliate_enabled),
    isFeatured: row.is_featured === undefined ? false : Boolean(row.is_featured),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapStoreSyncJobRow(row: Record<string, unknown>): StoreSyncJob {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    type: String(row.type) as StoreSyncJob["type"],
    mode: String(row.mode) as StoreSyncJob["mode"],
    status: String(row.status) as StoreSyncJob["status"],
    sourceOfTruth: String(row.source_of_truth) as StoreSyncJob["sourceOfTruth"],
    triggeredBy: String(row.triggered_by) as StoreSyncJob["triggeredBy"],
    requestedBy: row.requested_by ? String(row.requested_by) : null,
    parentJobId: row.parent_job_id ? String(row.parent_job_id) : null,
    notes: row.notes ? String(row.notes) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    cursor: row.cursor ? String(row.cursor) : null,
    recordsProcessed:
      row.records_processed === undefined ? 0 : Number(row.records_processed),
    recordsCreated:
      row.records_created === undefined ? 0 : Number(row.records_created),
    recordsUpdated:
      row.records_updated === undefined ? 0 : Number(row.records_updated),
    recordsFailed:
      row.records_failed === undefined ? 0 : Number(row.records_failed),
    requestedAt: String(row.requested_at),
    startedAt: row.started_at ? String(row.started_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapWebhookRecordRow(row: Record<string, unknown>): WebhookIngestionRecord {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    topic: String(row.topic) as WebhookIngestionRecord["topic"],
    shopDomain: String(row.shop_domain),
    externalEventId: String(row.external_event_id),
    status: String(row.status) as WebhookIngestionRecord["status"],
    attempts: row.attempts === undefined ? 1 : Number(row.attempts),
    errorMessage: row.error_message ? String(row.error_message) : null,
    orderId: row.order_id ? String(row.order_id) : null,
    referralCode: row.referral_code ? String(row.referral_code) : null,
    discountCode: row.discount_code ? String(row.discount_code) : null,
    influencerId: row.influencer_id ? String(row.influencer_id) : null,
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    conversionId: row.conversion_id ? String(row.conversion_id) : null,
    receivedAt: String(row.received_at),
    processedAt: row.processed_at ? String(row.processed_at) : null,
    payloadSummary:
      row.payload_summary && typeof row.payload_summary === "object"
        ? (row.payload_summary as JsonRecord)
        : {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getPrimaryLiveStoreConnection() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_connections")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapStoreConnectionRow(data) : null;
}

async function getLiveStoreConnectionById(connectionId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_connections")
    .select("*")
    .eq("id", connectionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapStoreConnectionRow(data) : null;
}

export async function getLiveStoreConnectionByOwnerProfileId(ownerProfileId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_connections")
    .select("*")
    .eq("owner_profile_id", ownerProfileId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapStoreConnectionRow(data) : null;
}

export async function getLiveStoreConnectionByShopDomain(shopDomain: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_connections")
    .select("*")
    .eq("shop_domain", normalizeShopifyShopDomain(shopDomain))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapStoreConnectionRow(data) : null;
}

export async function listLiveStoreCatalogItems(connectionId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("store_catalog_items")
    .select("*")
    .order("updated_at", { ascending: false });

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapStoreCatalogItemRow(row));
}

export async function listLiveStoreSyncJobs(connectionId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("store_sync_jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapStoreSyncJobRow(row));
}

export async function listLiveWebhookIngestionRecords(
  status: WebhookProcessingStatus | "all" = "all",
  connectionId?: string,
) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("webhook_ingestion_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (connectionId) {
    query = query.eq("connection_id", connectionId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapWebhookRecordRow(row));
}

export async function upsertStoreConnectionFromOAuth(input: {
  ownerProfileId: string | null;
  shopDomain: string;
  accessToken: string;
  grantedScopes: string[];
}) {
  if (!isShopifyConfigured()) {
    throw new Error("L'ambiente del bridge Shopify non e configurato.");
  }

  const identity = await fetchShopifyShopIdentity(input.shopDomain, input.accessToken);
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const encryptedAccessToken = encryptShopifyAccessToken(input.accessToken);

  const { data, error } = await admin
    .from("store_connections")
    .upsert(
      {
        owner_profile_id: input.ownerProfileId,
        platform: "shopify",
        store_name: identity.storeName,
        shop_domain: normalizeShopifyShopDomain(input.shopDomain),
        storefront_url: identity.storefrontUrl,
        default_destination_url: identity.storefrontUrl,
        install_state: "installed",
        status: "connected",
        connection_health: "healthy",
        sync_products_enabled: true,
        sync_discount_codes_enabled: true,
        order_attribution_enabled: true,
        auto_create_discount_codes: true,
        app_embed_enabled: false,
        required_scopes: getRequiredShopifyScopes(),
        granted_scopes: input.grantedScopes,
        access_token_encrypted: encryptedAccessToken,
        installed_at: now,
        connected_at: now,
        last_health_check_at: now,
        last_health_error: null,
        token_updated_at: now,
        updated_at: now,
      },
      { onConflict: "shop_domain" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapStoreConnectionRow(data);
}

async function getAccessTokenForConnection(connectionId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_connections")
    .select("id, shop_domain, access_token_encrypted")
    .eq("id", connectionId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Store connection not found.");
  }

  const encrypted = data.access_token_encrypted;

  if (!encrypted) {
    throw new Error("Nessun token di accesso Shopify e salvato per questa connessione.");
  }

  return {
    shopDomain: String(data.shop_domain),
    accessToken: decryptShopifyAccessToken(String(encrypted)),
  };
}

async function createSyncJobRow(input: {
  connectionId: string;
  type: StoreSyncJobInput["type"];
  mode: StoreSyncJobInput["mode"];
  requestedBy: string | null;
  notes?: string | null;
  triggeredBy: StoreSyncJob["triggeredBy"];
  parentJobId?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("store_sync_jobs")
    .insert({
      connection_id: input.connectionId,
      type: input.type,
      mode: input.mode,
      status: "queued",
      source_of_truth: getStoreSyncSource(input.type),
      triggered_by: input.triggeredBy,
      requested_by: input.requestedBy,
      parent_job_id: input.parentJobId ?? null,
      notes: input.notes?.trim() || null,
      requested_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapStoreSyncJobRow(data);
}

async function updateSyncJobRow(jobId: string, values: Record<string, unknown>) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_sync_jobs")
    .update(values)
    .eq("id", jobId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapStoreSyncJobRow(data);
}

async function recomputeConnectionHealth(connectionId: string) {
  const [connection, syncJobs, webhooks] = await Promise.all([
    getLiveStoreConnectionById(connectionId),
    listLiveStoreSyncJobs(connectionId),
    listLiveWebhookIngestionRecords("all", connectionId),
  ]);

  if (!connection) {
    return null;
  }

  const evaluation = evaluateStoreConnectionHealth(connection, syncJobs, webhooks);
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("store_connections")
    .update({
      connection_health: evaluation.health,
      last_health_error: evaluation.message,
      last_health_check_at: now,
      updated_at: now,
    })
    .eq("id", connectionId);

  return evaluation;
}

export async function runLiveStoreSync(
  input: StoreSyncJobInput,
  actorProfileId: string,
  connectionId?: string,
) {
  if (!isShopifyConfigured()) {
    throw new Error("L'ambiente del bridge Shopify non e configurato.");
  }

  const connection = connectionId
    ? await getLiveStoreConnectionById(connectionId)
    : await getLiveStoreConnectionByOwnerProfileId(actorProfileId);

  if (!connection) {
    throw new Error("Nessuna connessione Shopify disponibile per questo workspace merchant.");
  }

  const job = await createSyncJobRow({
    connectionId: connection.id,
    type: input.type,
    mode: input.mode,
    requestedBy: actorProfileId,
    notes: input.notes ?? null,
    triggeredBy: "merchant",
  });

  const now = new Date().toISOString();

  try {
    await updateSyncJobRow(job.id, {
      status: "running",
      started_at: now,
      updated_at: now,
    });

    if (!["products", "collections", "pages"].includes(input.type)) {
      throw new Error(
        `${input.type} live sync is not wired yet in this pass. Catalog sync is the first real bridge.`,
      );
    }

    const { shopDomain, accessToken } = await getAccessTokenForConnection(connection.id);
    const catalog = await fetchShopifyCatalogSnapshot(shopDomain, accessToken);
    const selected = catalog.filter((item) =>
      input.type === "products"
        ? item.type === "product"
        : input.type === "collections"
          ? item.type === "collection"
          : item.type === "page",
    );

    const admin = createSupabaseAdminClient();
    const existingItemsResponse = await admin
      .from("store_catalog_items")
      .select("shopify_resource_id, is_affiliate_enabled, is_featured")
      .eq("connection_id", connection.id);

    if (existingItemsResponse.error) {
      throw new Error(existingItemsResponse.error.message);
    }

    const existingItems = new Map(
      (existingItemsResponse.data ?? []).map((item) => [
        String(item.shopify_resource_id),
        item,
      ]),
    );
    const upsertPayload = selected.map((item) => {
      const existing = existingItems.get(item.shopifyResourceId ?? "");

      return {
        connection_id: connection.id,
        shopify_resource_id: item.shopifyResourceId,
        title: item.title,
        type: item.type,
        handle: item.handle,
        destination_url: item.destinationUrl,
        is_affiliate_enabled: existing?.is_affiliate_enabled ?? true,
        is_featured: existing?.is_featured ?? false,
        source_updated_at: item.sourceUpdatedAt,
        last_synced_at: now,
        raw_payload: item.rawPayload,
        updated_at: now,
      };
    });

    if (upsertPayload.length) {
      const { error: upsertError } = await admin.from("store_catalog_items").upsert(
        upsertPayload,
        { onConflict: "connection_id,shopify_resource_id" },
      );

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    const counts = {
      products: catalog.filter((item) => item.type === "product").length,
      collections: catalog.filter((item) => item.type === "collection").length,
    };

    const { error: connectionError } = await admin
      .from("store_connections")
      .update({
        last_products_sync_at: now,
        products_synced_count: counts.products,
        collections_synced_count: counts.collections,
        updated_at: now,
      })
      .eq("id", connection.id);

    if (connectionError) {
      throw new Error(connectionError.message);
    }

    const completed = await updateSyncJobRow(job.id, {
      status: "succeeded",
      completed_at: now,
      updated_at: now,
      cursor: `${input.type}:${now}`,
      records_processed: selected.length,
      records_created: selected.length,
      records_updated: 0,
      records_failed: 0,
      error_message: null,
    });

    await recomputeConnectionHealth(connection.id);
    return completed;
  } catch (error) {
    const failed = await updateSyncJobRow(job.id, {
      status: "failed",
      completed_at: now,
      updated_at: now,
      error_message: error instanceof Error ? error.message : "Shopify sync failed.",
      records_failed: 1,
    });
    await recomputeConnectionHealth(connection.id);
    return failed;
  }
}

export async function retryLiveStoreSync(jobId: string, actorProfileId: string) {
  const jobs = await listLiveStoreSyncJobs();
  const original = jobs.find((job) => job.id === jobId);

  if (!original) {
    throw new Error("Job di sync store non trovato.");
  }

  return runLiveStoreSync(
    {
      type: original.type,
      mode: "retry",
      notes: original.notes ?? undefined,
    },
    actorProfileId,
    original.connectionId,
  );
}

function summarizeWebhookPayload(topic: string, payload: Record<string, unknown>): JsonRecord {
  if (topic.startsWith("orders/")) {
    const orderId =
      typeof payload.name === "string"
        ? payload.name
        : typeof payload.id === "number"
          ? String(payload.id)
          : null;
    const totalPrice =
      typeof payload.current_total_price === "string"
        ? Number(payload.current_total_price)
        : null;
    const currency =
      typeof payload.currency === "string" ? payload.currency : null;
    const referralCode =
      Array.isArray(payload.note_attributes)
        ? ((payload.note_attributes as Array<Record<string, unknown>>).find(
            (item) => item.name === "ref" || item.name === "affiliate_ref",
          )?.value as string | undefined) ?? null
        : null;
    const discountCode =
      Array.isArray(payload.discount_codes) &&
      (payload.discount_codes as Array<Record<string, unknown>>).length > 0
        ? String(
            (payload.discount_codes as Array<Record<string, unknown>>)[0]?.code ?? "",
          ) || null
        : null;

    return {
      orderAmount: totalPrice,
      currency,
      orderId,
      referralCode,
      discountCode,
      bridgeScope: "persistence_only",
    };
  }

  return {
    bridgeScope: "persistence_only",
  };
}

export async function persistIncomingWebhook(input: {
  topic: string;
  shopDomain: string;
  webhookId: string | null;
  rawBody: string;
  hmacValid: boolean;
}) {
  const admin = createSupabaseAdminClient();
  const connection = await getLiveStoreConnectionByShopDomain(input.shopDomain);
  const now = new Date().toISOString();
  const payload = JSON.parse(input.rawBody) as Record<string, unknown>;
  const summary = summarizeWebhookPayload(input.topic, payload);
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`${input.shopDomain}:${input.webhookId ?? ""}:${input.rawBody}`)
    .digest("hex");

  const existing = await admin
    .from("webhook_ingestion_records")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing.data) {
    return mapWebhookRecordRow(existing.data);
  }

  const status =
    input.topic === "app/uninstalled"
      ? "processed"
      : input.hmacValid
        ? "received"
        : "failed";
  const errorMessage = input.hmacValid ? null : "Webhook HMAC verification failed.";

  const { data, error } = await admin
    .from("webhook_ingestion_records")
    .insert({
      connection_id: connection?.id ?? null,
      topic: input.topic,
      shop_domain: normalizeShopifyShopDomain(input.shopDomain),
      external_event_id: input.webhookId ?? crypto.randomUUID(),
      webhook_id: input.webhookId,
      idempotency_key: idempotencyKey,
      status,
      attempts: 1,
      error_message: errorMessage,
      order_id:
        typeof summary.orderId === "string" ? summary.orderId : null,
      referral_code:
        typeof summary.referralCode === "string" ? summary.referralCode : null,
      discount_code:
        typeof summary.discountCode === "string" ? summary.discountCode : null,
      received_at: now,
      processed_at: status === "processed" ? now : null,
      payload_summary: summary,
      raw_payload: payload,
      headers: {
        shop_domain: input.shopDomain,
        webhook_id: input.webhookId,
      },
      hmac_valid: input.hmacValid,
      last_attempt_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (connection) {
    const nextConnectionValues: Record<string, unknown> = {
      last_webhook_at: now,
      updated_at: now,
    };

    if (input.topic === "app/uninstalled") {
      nextConnectionValues.install_state = "not_installed";
      nextConnectionValues.status = "not_connected";
      nextConnectionValues.connection_health = "error";
      nextConnectionValues.connected_at = null;
      nextConnectionValues.last_health_error =
        "Shopify app uninstall event received.";
    }

    await admin.from("store_connections").update(nextConnectionValues).eq("id", connection.id);
    await recomputeConnectionHealth(connection.id);
  }

  return mapWebhookRecordRow(data);
}

export async function retryLiveWebhookRecord(recordId: string, actorProfileId: string) {
  void actorProfileId;
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const existing = await admin
    .from("webhook_ingestion_records")
    .select("attempts")
    .eq("id", recordId)
    .maybeSingle();

  if (existing.error || !existing.data) {
    throw new Error(existing.error?.message ?? "Webhook ingestion record not found.");
  }

  const { data, error } = await admin
    .from("webhook_ingestion_records")
    .update({
      status: "received",
      error_message: null,
      attempts: Number(existing.data.attempts ?? 0) + 1,
      last_attempt_at: now,
      updated_at: now,
    })
    .eq("id", recordId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = mapWebhookRecordRow(data);

  if (row.connectionId) {
    await recomputeConnectionHealth(row.connectionId);
  }

  return row;
}

export function assertShopifyBridgeConfigured() {
  if (!isShopifyConfigured()) {
    throw new Error("L'ambiente del bridge Shopify non e configurato.");
  }
}

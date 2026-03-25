import { SHOPIFY_SCOPE_VALUES } from "@/lib/constants";
import type {
  ConnectionHealthStatus,
  StoreConnection,
  StoreSyncJob,
  StoreSyncJobType,
  StoreSyncSource,
  WebhookIngestionRecord,
} from "@/lib/types";

const SYNC_SCOPE_MAP: Record<StoreSyncJobType, string[]> = {
  products: ["read_products"],
  collections: ["read_content"],
  pages: ["read_content"],
  discounts: ["read_discounts", "write_discounts"],
  orders: ["read_orders"],
  attribution: ["read_orders"],
};

const SYNC_SOURCE_MAP: Record<StoreSyncJobType, StoreSyncSource> = {
  products: "shopify",
  collections: "shopify",
  pages: "shopify",
  discounts: "hybrid",
  orders: "shopify",
  attribution: "hybrid",
};

export function getRequiredScopesForSyncType(type: StoreSyncJobType) {
  return SYNC_SCOPE_MAP[type];
}

export function getStoreSyncSource(type: StoreSyncJobType): StoreSyncSource {
  return SYNC_SOURCE_MAP[type];
}

export function getMissingShopifyScopes(connection: StoreConnection) {
  const granted = new Set(connection.grantedScopes);
  return connection.requiredScopes.filter((scope) => !granted.has(scope));
}

function isRecentFailure(timestamp: string) {
  const age = Date.now() - new Date(timestamp).getTime();
  return age <= 1000 * 60 * 60 * 24 * 7;
}

export function evaluateStoreConnectionHealth(
  connection: StoreConnection,
  syncJobs: StoreSyncJob[],
  webhookRecords: WebhookIngestionRecord[],
) {
  const missingScopes = getMissingShopifyScopes(connection);
  const recentFailedJobs = syncJobs.filter(
    (job) =>
      (job.status === "failed" || job.status === "partial") &&
      isRecentFailure(job.createdAt),
  );
  const recentFailedWebhooks = webhookRecords.filter(
    (record) => record.status === "failed" && isRecentFailure(record.createdAt),
  );

  let health: ConnectionHealthStatus = "healthy";
  let message: string | null = null;

  if (
    connection.installState === "not_installed" ||
    connection.status === "not_connected"
  ) {
    health = "error";
    message = "L'app Shopify non e installata oppure lo store non e collegato.";
  } else if (connection.installState === "reauth_required") {
    health = "error";
    message = "L'accesso Shopify deve essere riautorizzato prima di riprendere il sync.";
  } else if (connection.status === "attention_required") {
    health = "warning";
    message = "La connessione store richiede una verifica merchant prima di essere considerata affidabile.";
  } else if (missingScopes.length > 0) {
    health = "degraded";
    message = `Scope Shopify mancanti: ${missingScopes.join(", ")}.`;
  } else if (connection.orderAttributionEnabled && !connection.appEmbedEnabled) {
    health = "warning";
    message = "Il tracking storefront e incompleto perche il theme app embed non e attivo.";
  } else if (recentFailedJobs.length > 0 || recentFailedWebhooks.length > 0) {
    health =
      recentFailedJobs.length + recentFailedWebhooks.length > 2
        ? "degraded"
        : "warning";
    message =
      recentFailedJobs.length > 0
        ? "Uno o piu job di sync Shopify richiedono un nuovo tentativo."
        : "Uno o piu eventi webhook Shopify non sono stati elaborati correttamente.";
  }

  return {
    health,
    message,
    missingScopes,
    failedJobsCount: recentFailedJobs.length,
    failedWebhooksCount: recentFailedWebhooks.length,
  };
}

export const shopifyScopeValues = [...SHOPIFY_SCOPE_VALUES];

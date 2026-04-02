import {
  DEFAULT_COMMISSION_TYPE,
  DEFAULT_COMMISSION_VALUE,
  DEFAULT_CURRENCY,
  DEFAULT_REFERRAL_BASE_PATH,
  DEFAULT_REFERRAL_DESTINATION_PATH,
  SHOPIFY_SCOPE_VALUES,
} from "@/lib/constants";
import { developmentAccounts } from "@/lib/demo/development-accounts";
import type { DemoDatabase, Profile } from "@/lib/types";
import { hashPassword, toStoredDestinationUrl } from "@/lib/utils";

function isoDaysAgo(daysAgo: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function createSeedDatabase() {
  const now = new Date().toISOString();
  const adminCreatedAt = isoDaysAgo(120, 9);
  const storefrontDestination = toStoredDestinationUrl(
    DEFAULT_REFERRAL_DESTINATION_PATH,
  );

  const adminProfile = {
    id: "profile_admin",
    authUserId: "auth_admin",
    role: "ADMIN",
    fullName: "Elevia Staff",
    email: developmentAccounts.merchant.email,
    avatarUrl: null,
    country: "Stati Uniti",
    createdAt: adminCreatedAt,
    updatedAt: adminCreatedAt,
  } satisfies Profile;

  return {
    meta: {
      initializedAt: now,
      version: 9,
    },
    authAccounts: [
      {
        id: "demo_auth_admin",
        profileId: adminProfile.id,
        email: adminProfile.email,
        passwordHash: hashPassword(developmentAccounts.merchant.password),
      },
    ],
    profiles: [adminProfile],
    influencerApplications: [],
    influencers: [],
    referralLinks: [],
    linkClicks: [],
    conversions: [],
    payouts: [],
    payoutAllocations: [],
    storeCatalogItems: [],
    storeSyncJobs: [],
    webhookIngestionRecords: [],
    promoAssets: [],
    influencerAssetAccess: [],
    promoCodes: [],
    campaigns: [],
    rewards: [],
    suspiciousEvents: [],
    affiliateInvites: [],
    programSettings: {
      id: "program_settings_default",
      defaultCommissionType: DEFAULT_COMMISSION_TYPE,
      defaultCommissionValue: DEFAULT_COMMISSION_VALUE,
      defaultCurrency: DEFAULT_CURRENCY,
      referralBasePath: DEFAULT_REFERRAL_BASE_PATH,
      defaultReferralDestinationPath: DEFAULT_REFERRAL_DESTINATION_PATH,
      allowAffiliateCodeGeneration: true,
      allowPromoCodeRequests: true,
      allowCustomLinkDestinations: true,
      promoCodePrefix: "AFF",
      emailBrandName: "Affinity",
      emailReplyTo: "partners@elevianutrition.eu",
      antiLeakEnabled: true,
      blockSelfReferrals: true,
      requireCodeOwnershipMatch: true,
      fraudReviewEnabled: true,
      maxClicksPerIpPerDay: 6,
      maxConversionsPerIpPerDay: 2,
      enableRewards: true,
      enableStoreCredit: true,
      enableMarketplace: false,
      enableMultiLevel: false,
      enableMultiProgram: false,
      enableAutoPayouts: false,
      allowedDestinationUrls: [storefrontDestination],
      createdAt: adminCreatedAt,
      updatedAt: now,
    },
    storeConnection: {
      id: "store_connection_default",
      platform: "shopify",
      storeName: "",
      shopDomain: "",
      storefrontUrl: storefrontDestination,
      defaultDestinationUrl: storefrontDestination,
      installState: "not_installed",
      status: "not_connected",
      connectionHealth: "error",
      syncProductsEnabled: false,
      syncDiscountCodesEnabled: false,
      orderAttributionEnabled: false,
      autoCreateDiscountCodes: false,
      appEmbedEnabled: false,
      requiredScopes: [...SHOPIFY_SCOPE_VALUES],
      grantedScopes: [],
      installedAt: null,
      connectedAt: null,
      lastHealthCheckAt: null,
      lastHealthError: null,
      lastProductsSyncAt: null,
      lastDiscountSyncAt: null,
      lastOrdersSyncAt: null,
      lastWebhookAt: null,
      productsSyncedCount: 0,
      collectionsSyncedCount: 0,
      discountsSyncedCount: 0,
      updatedAt: now,
    },
    auditLogs: [],
  } satisfies DemoDatabase;
}

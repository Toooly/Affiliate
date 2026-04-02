import { promises as fs } from "node:fs";
import path from "node:path";

import type { DemoDatabase } from "@/lib/types";

import { createSeedDatabase } from "@/lib/demo/seed";
import { createAbsoluteUrl, toStoredDestinationUrl } from "@/lib/utils";

const demoDbPath = path.join(process.cwd(), "data", "demo-db.json");

async function ensureDemoFile() {
  await fs.mkdir(path.dirname(demoDbPath), { recursive: true });

  try {
    await fs.access(demoDbPath);
  } catch {
    const seed = createSeedDatabase();
    await fs.writeFile(demoDbPath, JSON.stringify(seed, null, 2), "utf8");
  }
}

function normalizeDemoDatabase(raw: DemoDatabase) {
  const seed = createSeedDatabase();
  const rawVersion = raw.meta?.version ?? 0;
  const shouldApplyLegacyV8Migration = rawVersion < 8;
  const shouldApplyFirstRunV9Migration = rawVersion < 9;
  const normalized = structuredClone(raw) as DemoDatabase & {
    promoCodes?: DemoDatabase["promoCodes"];
    campaigns?: DemoDatabase["campaigns"];
    rewards?: DemoDatabase["rewards"];
    suspiciousEvents?: DemoDatabase["suspiciousEvents"];
    affiliateInvites?: DemoDatabase["affiliateInvites"];
    storeConnection?: DemoDatabase["storeConnection"];
    payoutAllocations?: DemoDatabase["payoutAllocations"];
    storeCatalogItems?: DemoDatabase["storeCatalogItems"];
    storeSyncJobs?: DemoDatabase["storeSyncJobs"];
    webhookIngestionRecords?: DemoDatabase["webhookIngestionRecords"];
  };

  normalized.meta = {
    ...seed.meta,
    ...normalized.meta,
    version: 9,
  };

  if (shouldApplyFirstRunV9Migration) {
    normalized.authAccounts = structuredClone(seed.authAccounts);
    normalized.profiles = structuredClone(seed.profiles);
    normalized.influencerApplications = structuredClone(seed.influencerApplications);
    normalized.influencers = structuredClone(seed.influencers);
    normalized.referralLinks = structuredClone(seed.referralLinks);
    normalized.linkClicks = structuredClone(seed.linkClicks);
    normalized.conversions = structuredClone(seed.conversions);
    normalized.payouts = structuredClone(seed.payouts);
    normalized.payoutAllocations = structuredClone(seed.payoutAllocations);
    normalized.storeCatalogItems = structuredClone(seed.storeCatalogItems);
    normalized.storeSyncJobs = structuredClone(seed.storeSyncJobs);
    normalized.webhookIngestionRecords = structuredClone(seed.webhookIngestionRecords);
    normalized.promoAssets = structuredClone(seed.promoAssets);
    normalized.influencerAssetAccess = structuredClone(seed.influencerAssetAccess);
    normalized.promoCodes = structuredClone(seed.promoCodes);
    normalized.campaigns = structuredClone(seed.campaigns);
    normalized.rewards = structuredClone(seed.rewards);
    normalized.suspiciousEvents = structuredClone(seed.suspiciousEvents);
    normalized.affiliateInvites = structuredClone(seed.affiliateInvites);
    normalized.programSettings = structuredClone(seed.programSettings);
    normalized.storeConnection = structuredClone(seed.storeConnection);
    normalized.auditLogs = structuredClone(seed.auditLogs);
  } else {
    normalized.authAccounts = normalized.authAccounts ?? seed.authAccounts;
    normalized.profiles = normalized.profiles ?? seed.profiles;
  }

  const seedAdminProfile = seed.profiles.find((profile) => profile.id === "profile_admin");
  const seedAdminAccount = seed.authAccounts.find((account) => account.id === "demo_auth_admin");

  if (seedAdminProfile) {
    const existingAdminProfileIndex = normalized.profiles.findIndex(
      (profile) => profile.id === seedAdminProfile.id || profile.role === "ADMIN",
    );

    if (existingAdminProfileIndex === -1) {
      normalized.profiles.unshift(seedAdminProfile);
    } else if (shouldApplyLegacyV8Migration) {
      normalized.profiles[existingAdminProfileIndex] = {
        ...normalized.profiles[existingAdminProfileIndex],
        ...seedAdminProfile,
      };
    }
  }

  if (seedAdminAccount) {
    const existingAdminAccountIndex = normalized.authAccounts.findIndex(
      (account) =>
        account.id === seedAdminAccount.id ||
        account.profileId === seedAdminAccount.profileId ||
        account.email.toLowerCase() === "ops@elevianutrition.com",
    );

    if (existingAdminAccountIndex === -1) {
      normalized.authAccounts.unshift(seedAdminAccount);
    } else if (shouldApplyLegacyV8Migration) {
      normalized.authAccounts[existingAdminAccountIndex] = {
        ...normalized.authAccounts[existingAdminAccountIndex],
        ...seedAdminAccount,
      };
    }
  }

  normalized.referralLinks = (normalized.referralLinks ?? seed.referralLinks).map((link) => ({
    ...link,
    name:
      "name" in link && link.name
        ? link.name
        : link.isPrimary
          ? "Link storefront principale"
          : "Link campagna",
    destinationUrl: toStoredDestinationUrl(link.destinationUrl),
    isActive: "isActive" in link ? Boolean(link.isActive) : true,
    archivedAt: "archivedAt" in link ? link.archivedAt ?? null : null,
    campaignId: "campaignId" in link ? link.campaignId ?? null : null,
    utmSource: "utmSource" in link ? link.utmSource ?? null : null,
    utmMedium: "utmMedium" in link ? link.utmMedium ?? null : null,
    utmCampaign: "utmCampaign" in link ? link.utmCampaign ?? null : null,
  }));

  normalized.promoAssets = (normalized.promoAssets ?? seed.promoAssets).map(
    (asset) => ({
      ...asset,
      caption:
        "caption" in asset
          ? asset.caption ?? null
          : null,
      instructions:
        "instructions" in asset
          ? asset.instructions ?? null
          : null,
      campaignId:
        "campaignId" in asset
          ? asset.campaignId ?? null
          : null,
    }),
  );

  normalized.campaigns = (normalized.campaigns ?? seed.campaigns).map((campaign) => ({
    ...campaign,
    landingUrl: toStoredDestinationUrl(campaign.landingUrl),
    bonusTitle:
      "bonusTitle" in campaign
        ? campaign.bonusTitle ?? null
        : null,
    bonusDescription:
      "bonusDescription" in campaign
        ? campaign.bonusDescription ?? null
        : null,
    bonusType:
      "bonusType" in campaign
        ? campaign.bonusType ?? null
        : null,
    bonusValue:
      "bonusValue" in campaign
        ? campaign.bonusValue ?? null
        : null,
  }));

  const existingPromoCodes = normalized.promoCodes ?? seed.promoCodes;
  const ensuredPromoCodes = [...existingPromoCodes];

  normalized.influencers.forEach((influencer) => {
    if (!ensuredPromoCodes.some((code) => code.influencerId === influencer.id && code.isPrimary)) {
      ensuredPromoCodes.push({
        id: `code_${influencer.id}_primary`,
        influencerId: influencer.id,
        campaignId: null,
        code: influencer.discountCode,
        discountValue: 10,
        status: "active",
        source: "assigned",
        isPrimary: true,
        requestMessage: null,
        approvedBy: seed.profiles.find((profile) => profile.role === "ADMIN")?.id ?? null,
        createdAt: influencer.createdAt,
        updatedAt: influencer.updatedAt,
      });
    }
  });

  normalized.promoCodes = ensuredPromoCodes;

  normalized.conversions = (normalized.conversions ?? seed.conversions).map((conversion) => ({
    ...conversion,
    promoCodeId: "promoCodeId" in conversion ? conversion.promoCodeId ?? null : null,
    attributionSource:
      "attributionSource" in conversion
        ? conversion.attributionSource ?? "manual"
        : "manual",
  }));

  if (normalized.payoutAllocations?.length) {
    normalized.payoutAllocations = normalized.payoutAllocations.map((allocation) => ({
      ...allocation,
      releasedAt: "releasedAt" in allocation ? allocation.releasedAt ?? null : null,
    }));
  } else {
    const assignedConversionIds = new Set<string>();
    normalized.payoutAllocations = [...(normalized.payouts ?? seed.payouts)]
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      )
      .flatMap((payout) => {
        const candidates = (normalized.conversions ?? seed.conversions)
          .filter(
            (conversion) =>
              conversion.influencerId === payout.influencerId &&
              !assignedConversionIds.has(conversion.id) &&
              (payout.status === "paid"
                ? conversion.status === "paid"
                : conversion.status === "approved"),
          )
          .sort(
            (left, right) =>
              new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
          );
        let runningAmount = 0;

        return candidates.flatMap((conversion) => {
          if (runningAmount >= payout.amount - 0.009) {
            return [];
          }

          runningAmount += conversion.commissionAmount;
          assignedConversionIds.add(conversion.id);

          return [
            {
              id: `payout_alloc_${payout.id}_${conversion.id}`,
              payoutId: payout.id,
              conversionId: conversion.id,
              influencerId: payout.influencerId,
              amount: conversion.commissionAmount,
              releasedAt: null,
              createdAt: payout.createdAt,
            },
          ];
        });
      });
  }

  normalized.programSettings = {
    ...seed.programSettings,
    ...normalized.programSettings,
    allowAffiliateCodeGeneration:
      normalized.programSettings?.allowAffiliateCodeGeneration ?? true,
    allowPromoCodeRequests:
      normalized.programSettings?.allowPromoCodeRequests ?? true,
    allowCustomLinkDestinations:
      normalized.programSettings?.allowCustomLinkDestinations ?? true,
    promoCodePrefix: normalized.programSettings?.promoCodePrefix ?? "AFF",
    emailBrandName: normalized.programSettings?.emailBrandName ?? "Affinity",
    emailReplyTo:
      normalized.programSettings?.emailReplyTo ?? "partners@elevianutrition.com",
    antiLeakEnabled: normalized.programSettings?.antiLeakEnabled ?? true,
    blockSelfReferrals: normalized.programSettings?.blockSelfReferrals ?? true,
    requireCodeOwnershipMatch:
      normalized.programSettings?.requireCodeOwnershipMatch ?? true,
    fraudReviewEnabled: normalized.programSettings?.fraudReviewEnabled ?? true,
    maxClicksPerIpPerDay:
      normalized.programSettings?.maxClicksPerIpPerDay ?? 6,
    maxConversionsPerIpPerDay:
      normalized.programSettings?.maxConversionsPerIpPerDay ?? 2,
    enableRewards: normalized.programSettings?.enableRewards ?? true,
    enableStoreCredit: normalized.programSettings?.enableStoreCredit ?? true,
    enableMarketplace: normalized.programSettings?.enableMarketplace ?? false,
    enableMultiLevel: normalized.programSettings?.enableMultiLevel ?? false,
    enableMultiProgram: normalized.programSettings?.enableMultiProgram ?? false,
    enableAutoPayouts: normalized.programSettings?.enableAutoPayouts ?? false,
    allowedDestinationUrls:
      normalized.programSettings?.allowedDestinationUrls?.length
        ? normalized.programSettings.allowedDestinationUrls.map((url) =>
            toStoredDestinationUrl(url),
          )
        : seed.programSettings.allowedDestinationUrls.map((url) =>
            toStoredDestinationUrl(url.startsWith("http") ? url : createAbsoluteUrl(url)),
          ),
  };

  if (shouldApplyLegacyV8Migration) {
    normalized.programSettings.defaultCommissionType =
      seed.programSettings.defaultCommissionType;
    normalized.programSettings.defaultCommissionValue =
      seed.programSettings.defaultCommissionValue;
    normalized.programSettings.emailReplyTo = seed.programSettings.emailReplyTo;
  }

  normalized.storeConnection = {
    ...seed.storeConnection,
    ...normalized.storeConnection,
    platform: "shopify",
    storeName: normalized.storeConnection?.storeName ?? seed.storeConnection.storeName,
    shopDomain:
      normalized.storeConnection?.shopDomain ?? seed.storeConnection.shopDomain,
    storefrontUrl:
      toStoredDestinationUrl(
        normalized.storeConnection?.storefrontUrl ?? seed.storeConnection.storefrontUrl,
      ),
    defaultDestinationUrl:
      toStoredDestinationUrl(
        normalized.storeConnection?.defaultDestinationUrl ??
          normalized.programSettings.allowedDestinationUrls[0] ??
          seed.storeConnection.defaultDestinationUrl,
      ),
    installState:
      normalized.storeConnection?.installState ?? seed.storeConnection.installState,
    status: normalized.storeConnection?.status ?? seed.storeConnection.status,
    connectionHealth:
      normalized.storeConnection?.connectionHealth ??
      seed.storeConnection.connectionHealth,
    syncProductsEnabled:
      normalized.storeConnection?.syncProductsEnabled ??
      seed.storeConnection.syncProductsEnabled,
    syncDiscountCodesEnabled:
      normalized.storeConnection?.syncDiscountCodesEnabled ??
      seed.storeConnection.syncDiscountCodesEnabled,
    orderAttributionEnabled:
      normalized.storeConnection?.orderAttributionEnabled ??
      seed.storeConnection.orderAttributionEnabled,
    autoCreateDiscountCodes:
      normalized.storeConnection?.autoCreateDiscountCodes ??
      seed.storeConnection.autoCreateDiscountCodes,
    appEmbedEnabled:
      normalized.storeConnection?.appEmbedEnabled ??
      seed.storeConnection.appEmbedEnabled,
    requiredScopes:
      normalized.storeConnection?.requiredScopes ?? seed.storeConnection.requiredScopes,
    grantedScopes:
      normalized.storeConnection?.grantedScopes ?? seed.storeConnection.grantedScopes,
    installedAt:
      normalized.storeConnection?.installedAt ?? seed.storeConnection.installedAt,
    connectedAt:
      normalized.storeConnection?.connectedAt ?? seed.storeConnection.connectedAt,
    lastHealthCheckAt:
      normalized.storeConnection?.lastHealthCheckAt ??
      seed.storeConnection.lastHealthCheckAt,
    lastHealthError:
      normalized.storeConnection?.lastHealthError ??
      seed.storeConnection.lastHealthError,
    lastProductsSyncAt:
      normalized.storeConnection?.lastProductsSyncAt ??
      seed.storeConnection.lastProductsSyncAt,
    lastDiscountSyncAt:
      normalized.storeConnection?.lastDiscountSyncAt ??
      seed.storeConnection.lastDiscountSyncAt,
    lastOrdersSyncAt:
      normalized.storeConnection?.lastOrdersSyncAt ??
      seed.storeConnection.lastOrdersSyncAt,
    lastWebhookAt:
      normalized.storeConnection?.lastWebhookAt ??
      seed.storeConnection.lastWebhookAt,
    productsSyncedCount:
      normalized.storeConnection?.productsSyncedCount ??
      seed.storeConnection.productsSyncedCount,
    collectionsSyncedCount:
      normalized.storeConnection?.collectionsSyncedCount ??
      seed.storeConnection.collectionsSyncedCount,
    discountsSyncedCount:
      normalized.storeConnection?.discountsSyncedCount ??
      seed.storeConnection.discountsSyncedCount,
    updatedAt:
      normalized.storeConnection?.updatedAt ?? seed.storeConnection.updatedAt,
  };

  normalized.influencers = (normalized.influencers ?? seed.influencers).map((influencer) => {
    const legacyInfluencer = influencer as typeof influencer & {
      payoutProviderStatus?: string | null;
      companyName?: string | null;
      taxId?: string | null;
      notificationEmail?: string | null;
      notificationsEnabled?: boolean;
    };

    return {
      ...influencer,
      payoutProviderStatus:
        legacyInfluencer.payoutProviderStatus ??
        (influencer.payoutMethod === "paypal" ? "ready" : "not_connected"),
      companyName: legacyInfluencer.companyName ?? null,
      taxId: legacyInfluencer.taxId ?? null,
      notificationEmail:
        legacyInfluencer.notificationEmail ?? influencer.payoutEmail ?? null,
      notificationsEnabled: legacyInfluencer.notificationsEnabled ?? true,
    };
  });

  normalized.rewards = normalized.rewards ?? seed.rewards;
  normalized.suspiciousEvents = normalized.suspiciousEvents ?? seed.suspiciousEvents;
  normalized.affiliateInvites = (normalized.affiliateInvites ?? seed.affiliateInvites).map(
    (invite) => ({
      ...invite,
      invitedName: invite.invitedName ?? null,
      invitedEmail: invite.invitedEmail?.toLowerCase() ?? null,
      note: invite.note ?? null,
      campaignId: invite.campaignId ?? null,
      expiresAt: invite.expiresAt ?? null,
      claimedAt: invite.claimedAt ?? null,
      claimedProfileId: invite.claimedProfileId ?? null,
      claimedApplicationId: invite.claimedApplicationId ?? null,
      claimedInfluencerId: invite.claimedInfluencerId ?? null,
      revokedAt: invite.revokedAt ?? null,
    }),
  );
  const sourceStoreCatalogItems: DemoDatabase["storeCatalogItems"] =
    normalized.storeCatalogItems ?? seed.storeCatalogItems;

  normalized.storeCatalogItems = sourceStoreCatalogItems.map((item) => {
    return {
      ...item,
      shopifyResourceId: item.shopifyResourceId ?? null,
      handle: item.handle ?? null,
      destinationUrl: toStoredDestinationUrl(item.destinationUrl),
      isAffiliateEnabled: item.isAffiliateEnabled ?? true,
      isFeatured: item.isFeatured ?? false,
      updatedAt: item.updatedAt ?? item.createdAt,
    };
  });

  normalized.storeSyncJobs = normalized.storeSyncJobs ?? seed.storeSyncJobs;
  normalized.webhookIngestionRecords =
    normalized.webhookIngestionRecords ?? seed.webhookIngestionRecords;

  return normalized as DemoDatabase;
}

export async function readDemoDatabase() {
  await ensureDemoFile();
  const contents = await fs.readFile(demoDbPath, "utf8");
  return normalizeDemoDatabase(JSON.parse(contents) as DemoDatabase);
}

export async function writeDemoDatabase(db: DemoDatabase) {
  await ensureDemoFile();
  await fs.writeFile(demoDbPath, JSON.stringify(normalizeDemoDatabase(db), null, 2), "utf8");
}

export async function resetDemoDatabase() {
  const seed = createSeedDatabase();
  await writeDemoDatabase(seed);
  return seed;
}

export async function updateDemoDatabase<T>(
  updater: (db: DemoDatabase) => Promise<{ db: DemoDatabase; value: T }> | {
    db: DemoDatabase;
    value: T;
  },
) {
  const current = await readDemoDatabase();
  const { db, value } = await updater(structuredClone(current));
  await writeDemoDatabase(db);
  return value;
}

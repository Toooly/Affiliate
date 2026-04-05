import {
  buildPerformanceSeries,
  buildRecentActivity,
  calculateDashboardStats,
} from "@/lib/data/analytics";
import { readDemoDatabase, updateDemoDatabase } from "@/lib/demo/store";
import { evaluateStoreConnectionHealth, getRequiredScopesForSyncType, getStoreSyncSource } from "@/lib/shopify";
import type {
  AffiliateInvite,
  AffiliateInviteListItem,
  AffiliateInvitePublicSummary,
  AffiliateDetailData,
  ApplicationInput,
  Campaign,
  CampaignListItem,
  CampaignWorkspaceItem,
  Conversion,
  ConversionListItem,
  Influencer,
  InfluencerDashboardData,
  InfluencerApplication,
  InfluencerListItem,
  InfluencerSettingsData,
  Payout,
  PayoutAllocationListItem,
  PayoutBatchInput,
  PayoutDetailData,
  PayoutListItem,
  Profile,
  PromoAsset,
  PromoCode,
  PromoCodeListItem,
  ReferralLink,
  ReferralLinkListItem,
  Repository,
  StoreCatalogRulesInput,
  StoreConnection,
  StoreConnectionInput,
  StoreSyncJob,
  StoreSyncJobInput,
  SuspiciousEvent,
  SuspiciousEventListItem,
  TrackedReferralDestination,
  UserSession,
  WebhookIngestionRecord,
} from "@/lib/types";
import {
  appendQueryParams,
  calculateCommission,
  comparePassword,
  createPublicUrl,
  generateDiscountCode,
  generatePromoCode,
  generateReferralSlug,
  hashPassword,
  isAllowedDestinationUrl,
  normalizeHandle,
  sanitizePromoCode,
  uniqueId,
} from "@/lib/utils";

function byNewest<T extends { createdAt: string }>(records: T[]) {
  return [...records].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function findInfluencerByProfileId(records: Influencer[], profileId: string) {
  return records.find((record) => record.profileId === profileId) ?? null;
}

function findApplicationByProfileId(
  applications: InfluencerApplication[],
  profileId: string,
) {
  return (
    applications
      .filter((record) => record.profileId === profileId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )[0] ?? null
  );
}

function getProfileOrThrow(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  profileId: string,
) {
  const profile = db.profiles.find((item) => item.id === profileId);

  if (!profile) {
    throw new Error("Profilo non trovato.");
  }

  return profile;
}

function getInfluencerOrThrow(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencerId: string,
) {
  const influencer = db.influencers.find((item) => item.id === influencerId);

  if (!influencer) {
    throw new Error("Affiliato non trovato.");
  }

  return influencer;
}

function getApplicationOrThrow(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  applicationId: string,
) {
  const application = db.influencerApplications.find(
    (item) => item.id === applicationId,
  );

  if (!application) {
    throw new Error("Candidatura non trovata.");
  }

  return application;
}

function getReferralLinkOrThrow(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  linkId: string,
) {
  const link = db.referralLinks.find((item) => item.id === linkId);

  if (!link) {
  throw new Error("Referral link non trovato.");
  }

  return link;
}

function getPromoCodeOrThrow(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  promoCodeId: string,
) {
  const promoCode = db.promoCodes.find((item) => item.id === promoCodeId);

  if (!promoCode) {
  throw new Error("Codice promo non trovato.");
  }

  return promoCode;
}

function getCampaignOrThrow(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  campaignId: string,
) {
  const campaign = db.campaigns.find((item) => item.id === campaignId);

  if (!campaign) {
  throw new Error("Campagna non trovata.");
  }

  return campaign;
}

function getSuspiciousEventOrThrow(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  suspiciousEventId: string,
) {
  const suspiciousEvent = db.suspiciousEvents.find(
    (item) => item.id === suspiciousEventId,
  );

  if (!suspiciousEvent) {
  throw new Error("Evento sospetto non trovato.");
  }

  return suspiciousEvent;
}

function emailExists(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  email: string,
  ignoreProfileId?: string,
) {
  const normalized = email.toLowerCase();
  return db.profiles.some(
    (profile) =>
      profile.email.toLowerCase() === normalized && profile.id !== ignoreProfileId,
  );
}

function campaignAppliesToInfluencer(campaign: Campaign, influencerId: string) {
  return campaign.appliesToAll || campaign.affiliateIds.includes(influencerId);
}

function isInviteExpired(invite: AffiliateInvite, referenceTime = Date.now()) {
  return invite.expiresAt ? new Date(invite.expiresAt).getTime() < referenceTime : false;
}

function buildAffiliateInviteListItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  invite: AffiliateInvite,
) {
  const campaign = invite.campaignId
    ? db.campaigns.find((item) => item.id === invite.campaignId) ?? null
    : null;
  const createdBy = invite.createdByProfileId
    ? db.profiles.find((item) => item.id === invite.createdByProfileId) ?? null
    : null;
  const claimedProfile = invite.claimedProfileId
    ? db.profiles.find((item) => item.id === invite.claimedProfileId) ?? null
    : null;
  const expired = isInviteExpired(invite);
  const claimed = Boolean(invite.claimedAt);
  const revoked = Boolean(invite.revokedAt);

  return {
    ...invite,
    campaignName: campaign?.name ?? null,
    createdByName: createdBy?.fullName ?? null,
    claimedAffiliateName: claimedProfile?.fullName ?? null,
    claimedAffiliateEmail: claimedProfile?.email ?? null,
    registrationUrl: createPublicUrl(`/register?invite=${invite.token}`),
    isExpired: expired,
    isClaimable: !claimed && !expired && !revoked,
  } satisfies AffiliateInviteListItem;
}

function ensurePrimaryPartnerResources(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencer: Influencer,
  now: string,
) {
  const existingPrimaryLink = db.referralLinks.find(
    (link) => link.influencerId === influencer.id && link.isPrimary,
  );

  if (!existingPrimaryLink) {
    db.referralLinks.push({
      id: uniqueId("link"),
      influencerId: influencer.id,
      name: "Link principale storefront",
      code: influencer.publicSlug,
      destinationUrl: appendQueryParams("/shop", {
        ref: influencer.publicSlug,
      }),
      isPrimary: true,
      isActive: true,
      archivedAt: null,
      campaignId: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      createdAt: now,
    });
  }

  const existingPrimaryCode = db.promoCodes.find(
    (promoCode) => promoCode.influencerId === influencer.id && promoCode.isPrimary,
  );

  if (!existingPrimaryCode) {
    db.promoCodes.push({
      id: uniqueId("code"),
      influencerId: influencer.id,
      campaignId: null,
      code: influencer.discountCode,
      discountValue: 10,
      status: "active",
      source: "assigned",
      isPrimary: true,
      requestMessage: null,
      approvedBy: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

function activateInfluencerFromApplication(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  application: InfluencerApplication,
  profile: Profile,
  options: {
    reviewerProfileId: string | null;
    commissionType: Influencer["commissionType"];
    commissionValue: number;
    payoutMethod: Influencer["payoutMethod"];
    reviewNotes?: string | null;
    campaignId?: string | null;
    now: string;
  },
) {
  application.status = "approved";
  application.reviewedBy = options.reviewerProfileId;
  application.reviewNotes = options.reviewNotes?.trim() || null;
  application.reviewedAt = options.now;
  application.updatedAt = options.now;

  let influencer =
    db.influencers.find((candidate) => candidate.profileId === profile.id) ?? null;

  if (!influencer) {
    influencer = {
      id: uniqueId("inf"),
      profileId: profile.id,
      applicationId: application.id,
      publicSlug: generateReferralSlug(
        application.fullName,
        db.influencers.map((item) => item.publicSlug),
      ),
      discountCode: generateDiscountCode(
        application.fullName,
        db.influencers.map((item) => item.discountCode),
      ),
      commissionType: options.commissionType,
      commissionValue: options.commissionValue,
      isActive: true,
      payoutMethod: options.payoutMethod,
      payoutProviderStatus:
        options.payoutMethod === "paypal" ? "ready" : "not_connected",
      payoutEmail: application.email,
      companyName: null,
      taxId: null,
      notificationEmail: application.email,
      notificationsEnabled: true,
      notes: options.reviewNotes?.trim() || "",
      createdAt: options.now,
      updatedAt: options.now,
    };
    db.influencers.push(influencer);
  } else {
    influencer.applicationId = application.id;
    influencer.isActive = true;
    influencer.commissionType = options.commissionType;
    influencer.commissionValue = options.commissionValue;
    influencer.payoutMethod = options.payoutMethod;
    influencer.payoutProviderStatus =
      options.payoutMethod === "paypal" ? "ready" : influencer.payoutProviderStatus;
    influencer.payoutEmail = application.email;
    influencer.notificationEmail = application.email;
    influencer.notes = options.reviewNotes?.trim() || influencer.notes;
    influencer.updatedAt = options.now;
  }

  ensurePrimaryPartnerResources(db, influencer, options.now);

  if (options.campaignId) {
    const campaign = db.campaigns.find((item) => item.id === options.campaignId) ?? null;

    if (campaign && !campaign.appliesToAll && !campaign.affiliateIds.includes(influencer.id)) {
      campaign.affiliateIds = Array.from(new Set([...campaign.affiliateIds, influencer.id]));
      campaign.updatedAt = options.now;
    }
  }

  return influencer;
}

function buildInfluencerStats(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencerId: string,
) {
  const clicks = db.linkClicks.filter((click) => click.influencerId === influencerId);
  const conversions = db.conversions.filter(
    (conversion) => conversion.influencerId === influencerId,
  );

  return calculateDashboardStats(clicks, conversions);
}

function buildReferralLinkListItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  link: ReferralLink,
) {
  const influencer = getInfluencerOrThrow(db, link.influencerId);
  const profile = getProfileOrThrow(db, influencer.profileId);
  const campaign = link.campaignId
    ? db.campaigns.find((item) => item.id === link.campaignId) ?? null
    : null;
  const clicks = db.linkClicks.filter((click) => click.referralLinkId === link.id);
  const conversions = db.conversions.filter(
    (conversion) =>
      conversion.referralLinkId === link.id && conversion.status !== "cancelled",
  );

  return {
    ...link,
    influencerName: profile.fullName,
    influencerEmail: profile.email,
    campaignName: campaign?.name ?? null,
    clicks: clicks.length,
    conversions: conversions.length,
    revenue: conversions.reduce((sum, conversion) => sum + conversion.orderAmount, 0),
    commission: conversions.reduce(
      (sum, conversion) => sum + conversion.commissionAmount,
      0,
    ),
    lastClickAt:
      byNewest(clicks)[0]?.createdAt ?? byNewest(conversions)[0]?.createdAt ?? null,
    suspiciousEventsCount: db.suspiciousEvents.filter(
      (event) => event.referralLinkId === link.id && event.status === "open",
    ).length,
  } satisfies ReferralLinkListItem;
}

function buildPromoCodeListItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  promoCode: PromoCode,
) {
  const influencer = getInfluencerOrThrow(db, promoCode.influencerId);
  const profile = getProfileOrThrow(db, influencer.profileId);
  const campaign = promoCode.campaignId
    ? db.campaigns.find((item) => item.id === promoCode.campaignId) ?? null
    : null;
  const conversions = db.conversions.filter(
    (conversion) =>
      conversion.promoCodeId === promoCode.id && conversion.status !== "cancelled",
  );

  return {
    ...promoCode,
    influencerName: profile.fullName,
    influencerEmail: profile.email,
    campaignName: campaign?.name ?? null,
    conversions: conversions.length,
    revenue: conversions.reduce((sum, conversion) => sum + conversion.orderAmount, 0),
    commission: conversions.reduce(
      (sum, conversion) => sum + conversion.commissionAmount,
      0,
    ),
    suspiciousEventsCount: db.suspiciousEvents.filter(
      (event) => event.promoCodeId === promoCode.id && event.status === "open",
    ).length,
  } satisfies PromoCodeListItem;
}

function buildSuspiciousEventListItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  suspiciousEvent: SuspiciousEvent,
) {
  const influencer = getInfluencerOrThrow(db, suspiciousEvent.influencerId);
  const profile = getProfileOrThrow(db, influencer.profileId);
  const referralLink = suspiciousEvent.referralLinkId
    ? db.referralLinks.find((item) => item.id === suspiciousEvent.referralLinkId) ?? null
    : null;
  const promoCode = suspiciousEvent.promoCodeId
    ? db.promoCodes.find((item) => item.id === suspiciousEvent.promoCodeId) ?? null
    : null;

  return {
    ...suspiciousEvent,
    influencerName: profile.fullName,
    referralCode: referralLink?.code ?? null,
    promoCode: promoCode?.code ?? null,
  } satisfies SuspiciousEventListItem;
}

function buildCampaignWorkspaceItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  campaign: Campaign,
  influencerId: string,
) {
  const assets = byNewest(
    db.promoAssets.filter(
      (asset) => asset.isActive && asset.campaignId === campaign.id,
    ),
  );
  const promoCodes = byNewest(
    db.promoCodes.filter(
      (promoCode) =>
        promoCode.influencerId === influencerId && promoCode.campaignId === campaign.id,
    ),
  );
  const referralLinks = db.referralLinks
    .filter(
      (link) => link.influencerId === influencerId && link.campaignId === campaign.id,
    )
    .map((link) => buildReferralLinkListItem(db, link))
    .sort((left, right) => right.revenue - left.revenue);
  const rewards = byNewest(
    db.rewards.filter(
      (reward) =>
        reward.campaignId === campaign.id &&
        (reward.influencerId === null || reward.influencerId === influencerId),
    ),
  );

  return {
    ...campaign,
    assets,
    promoCodes,
    referralLinks,
    rewards,
    isAssigned: campaignAppliesToInfluencer(campaign, influencerId),
  } satisfies CampaignWorkspaceItem;
}

function buildPromoAssetsForInfluencer(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencerId: string,
) {
  const accessibleCampaignIds = new Set(
    db.campaigns
      .filter((campaign) => campaignAppliesToInfluencer(campaign, influencerId))
      .map((campaign) => campaign.id),
  );
  const directAccessAssetIds = new Set(
    db.influencerAssetAccess
      .filter((access) => access.influencerId === influencerId)
      .map((access) => access.assetId),
  );

  return byNewest(
    db.promoAssets.filter(
      (asset) =>
        asset.isActive &&
        (directAccessAssetIds.has(asset.id) ||
          asset.campaignId === null ||
          accessibleCampaignIds.has(asset.campaignId)),
    ),
  );
}

function resolveCampaignForConversion(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  conversion: Conversion,
) {
  const referralLink =
    db.referralLinks.find((link) => link.id === conversion.referralLinkId) ?? null;
  const promoCode =
    db.promoCodes.find((candidate) => candidate.id === conversion.promoCodeId) ?? null;
  const campaignId = referralLink?.campaignId ?? promoCode?.campaignId ?? null;
  const campaign = campaignId
    ? db.campaigns.find((item) => item.id === campaignId) ?? null
    : null;

  return {
    referralLink,
    promoCode,
    campaign,
  };
}

function getActivePayoutAllocation(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  conversionId: string,
) {
  return (
    byNewest(
      db.payoutAllocations.filter(
        (allocation) =>
          allocation.conversionId === conversionId && allocation.releasedAt === null,
      ),
    )[0] ?? null
  );
}

function buildConversionListItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  conversion: Conversion,
) {
  const influencer = getInfluencerOrThrow(db, conversion.influencerId);
  const profile = getProfileOrThrow(db, influencer.profileId);
  const { referralLink, promoCode, campaign } = resolveCampaignForConversion(db, conversion);
  const activeAllocation = getActivePayoutAllocation(db, conversion.id);
  const payout = activeAllocation
    ? db.payouts.find((item) => item.id === activeAllocation.payoutId) ?? null
    : null;

  return {
    ...conversion,
    influencerName: profile.fullName,
    referralCode: referralLink?.code ?? null,
    promoCode: promoCode?.code ?? null,
    campaignName: campaign?.name ?? null,
    attributionLabel: conversion.attributionSource.replaceAll("_", " "),
    suspiciousEventsCount: db.suspiciousEvents.filter(
      (event) => event.conversionId === conversion.id && event.status === "open",
    ).length,
    payoutId: payout?.id ?? null,
    payoutStatus: payout?.status ?? null,
    payoutReference: payout?.reference ?? null,
    payoutCreatedAt: payout?.createdAt ?? null,
    isAllocated: Boolean(activeAllocation),
  } satisfies ConversionListItem;
}

function buildPayoutListItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  payout: Payout,
) {
  const influencer = getInfluencerOrThrow(db, payout.influencerId);
  const profile = getProfileOrThrow(db, influencer.profileId);
  const allocations = db.payoutAllocations.filter(
    (allocation) => allocation.payoutId === payout.id,
  );
  const activeAllocations = allocations.filter(
    (allocation) => allocation.releasedAt === null,
  );
  const coveredConversions = activeAllocations
    .map((allocation) =>
      db.conversions.find((conversion) => conversion.id === allocation.conversionId) ?? null,
    )
    .filter((conversion): conversion is Conversion => Boolean(conversion));
  const campaignNames = Array.from(
    new Set(
      coveredConversions
        .map((conversion) => resolveCampaignForConversion(db, conversion).campaign?.name ?? null)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  return {
    ...payout,
    influencerName: profile.fullName,
    influencerEmail: profile.email,
    allocationsCount: allocations.length,
    activeAllocationsCount: activeAllocations.length,
    coveredCommission: Number(
      activeAllocations
        .reduce((sum, allocation) => sum + allocation.amount, 0)
        .toFixed(2),
    ),
    coveredRevenue: Number(
      coveredConversions.reduce((sum, conversion) => sum + conversion.orderAmount, 0).toFixed(2),
    ),
    releasedCommission: Number(
      allocations
        .filter((allocation) => allocation.releasedAt !== null)
        .reduce((sum, allocation) => sum + allocation.amount, 0)
        .toFixed(2),
    ),
    campaignNames,
  } satisfies PayoutListItem;
}

function buildPayoutAllocationListItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  allocation: (typeof db.payoutAllocations)[number],
) {
  const conversion = db.conversions.find((item) => item.id === allocation.conversionId);

  if (!conversion) {
    return null;
  }

  const conversionItem = buildConversionListItem(db, conversion);

  return {
    ...allocation,
    influencerName: conversionItem.influencerName,
    orderId: conversion.orderId,
    orderAmount: conversion.orderAmount,
    currency: conversion.currency,
    commissionAmount: conversion.commissionAmount,
    conversionStatus: conversion.status,
    campaignName: conversionItem.campaignName,
    referralCode: conversionItem.referralCode,
    promoCode: conversionItem.promoCode,
  } satisfies PayoutAllocationListItem;
}

function buildPayoutDetailData(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  payoutId: string,
) {
  const payout = db.payouts.find((item) => item.id === payoutId);

  if (!payout) {
    return null;
  }

  const influencer = buildInfluencerListItem(
    db,
    getInfluencerOrThrow(db, payout.influencerId),
  );
  const payoutItem = buildPayoutListItem(db, payout);
  const allocations = byNewest(
    db.payoutAllocations
      .filter((allocation) => allocation.payoutId === payout.id)
      .map((allocation) => buildPayoutAllocationListItem(db, allocation))
      .filter((allocation): allocation is PayoutAllocationListItem => Boolean(allocation)),
  );
  const availableConversions = byNewest(
    db.conversions
      .filter(
        (conversion) =>
          conversion.influencerId === payout.influencerId &&
          conversion.status === "approved" &&
          !getActivePayoutAllocation(db, conversion.id),
      )
      .map((conversion) => buildConversionListItem(db, conversion)),
  );

  return {
    payout: payoutItem,
    influencer,
    allocations,
    availableConversions,
    totals: {
      coveredCommission: payoutItem.coveredCommission,
      coveredRevenue: payoutItem.coveredRevenue,
      releasedCommission: payoutItem.releasedCommission,
      openApprovedCommission: Number(
        availableConversions
          .reduce((sum, conversion) => sum + conversion.commissionAmount, 0)
          .toFixed(2),
      ),
      paidCommission: Number(
        db.conversions
          .filter(
            (conversion) =>
              conversion.influencerId === payout.influencerId &&
              conversion.status === "paid",
          )
          .reduce((sum, conversion) => sum + conversion.commissionAmount, 0)
          .toFixed(2),
      ),
    },
  } satisfies PayoutDetailData;
}

function buildRewardsForInfluencer(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencerId: string,
) {
  return byNewest(
    db.rewards.filter(
      (reward) => reward.influencerId === influencerId || reward.influencerId === null,
    ),
  );
}

function buildSuspiciousEventsForInfluencer(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencerId: string,
) {
  return byNewest(
    db.suspiciousEvents.filter((event) => event.influencerId === influencerId),
  );
}

function pushSuspiciousEvent(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  input: Omit<SuspiciousEvent, "id">,
) {
  const exists = db.suspiciousEvents.some(
    (event) =>
      event.influencerId === input.influencerId &&
      event.type === input.type &&
      event.referralLinkId === input.referralLinkId &&
      event.promoCodeId === input.promoCodeId &&
      event.conversionId === input.conversionId &&
      event.status === "open",
  );

  if (exists) {
    return null;
  }

  const suspiciousEvent = {
    id: uniqueId("flag"),
    ...input,
  } satisfies SuspiciousEvent;

  db.suspiciousEvents.push(suspiciousEvent);
  return suspiciousEvent;
}

function refreshStoreConnectionHealth(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  now = new Date().toISOString(),
) {
  const evaluation = evaluateStoreConnectionHealth(
    db.storeConnection,
    db.storeSyncJobs,
    db.webhookIngestionRecords,
  );

  db.storeConnection.connectionHealth = evaluation.health;
  db.storeConnection.lastHealthError = evaluation.message;
  db.storeConnection.lastHealthCheckAt = now;
  db.storeConnection.updatedAt = now;

  return evaluation;
}

function resolveCommissionModel(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencer: Influencer,
  campaignId: string | null,
) {
  const campaign = campaignId
    ? db.campaigns.find((item) => item.id === campaignId) ?? null
    : null;

  if (campaign?.commissionType && campaign.commissionValue) {
    return {
      campaign,
      commissionType: campaign.commissionType,
      commissionValue: campaign.commissionValue,
    };
  }

  return {
    campaign,
    commissionType: influencer.commissionType ?? db.programSettings.defaultCommissionType,
    commissionValue:
      influencer.commissionValue ?? db.programSettings.defaultCommissionValue,
  };
}

function createStoreSyncJobRecord(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  input: {
    type: StoreSyncJobInput["type"];
    mode: StoreSyncJobInput["mode"];
    triggeredBy: StoreSyncJob["triggeredBy"];
    requestedBy: string | null;
    notes?: string | null;
    parentJobId?: string | null;
  },
) {
  const now = new Date().toISOString();

  return {
    id: uniqueId("sync"),
    connectionId: db.storeConnection.id,
    type: input.type,
    mode: input.mode,
    status: "queued",
    sourceOfTruth: getStoreSyncSource(input.type),
    triggeredBy: input.triggeredBy,
    requestedBy: input.requestedBy,
    parentJobId: input.parentJobId ?? null,
    notes: input.notes?.trim() || null,
    errorMessage: null,
    cursor: null,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    requestedAt: now,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  } satisfies StoreSyncJob;
}

function runStoreSyncJob(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  job: StoreSyncJob,
) {
  const now = new Date().toISOString();
  job.status = "running";
  job.startedAt = now;
  job.updatedAt = now;

  const requiredScopes = getRequiredScopesForSyncType(job.type);
  const missingScopes = requiredScopes.filter(
    (scope) => !db.storeConnection.grantedScopes.includes(scope),
  );

  if (
    db.storeConnection.installState !== "installed" ||
    db.storeConnection.status !== "connected"
  ) {
    job.status = "failed";
    job.errorMessage =
      "Shopify store is not fully installed and connected for sync execution.";
  } else if (missingScopes.length > 0) {
    job.status = "failed";
    job.errorMessage = `Missing Shopify scopes: ${missingScopes.join(", ")}.`;
    job.recordsFailed = 1;
  } else if (job.type === "attribution" && !db.storeConnection.appEmbedEnabled) {
    job.status = "failed";
    job.errorMessage =
      "Il tracking storefront non è pronto perché il theme app embed è disattivato.";
    job.recordsFailed = 1;
  } else if (job.type === "products" && !db.storeConnection.syncProductsEnabled) {
    job.status = "failed";
    job.errorMessage = "Product sync is currently disabled in store settings.";
    job.recordsFailed = 1;
  } else if (job.type === "discounts" && !db.storeConnection.syncDiscountCodesEnabled) {
    job.status = "failed";
    job.errorMessage = "Discount sync is currently disabled in store settings.";
    job.recordsFailed = 1;
  } else if (
    (job.type === "orders" || job.type === "attribution") &&
    !db.storeConnection.orderAttributionEnabled
  ) {
    job.status = "failed";
    job.errorMessage = "Order attribution is currently disabled in store settings.";
    job.recordsFailed = 1;
  } else {
    if (job.type === "products") {
      job.recordsProcessed = db.storeCatalogItems.filter(
        (item) => item.type === "product",
      ).length;
      job.recordsUpdated = job.recordsProcessed;
      db.storeConnection.lastProductsSyncAt = now;
      db.storeConnection.productsSyncedCount = job.recordsProcessed;
      db.storeConnection.collectionsSyncedCount = db.storeCatalogItems.filter(
        (item) => item.type === "collection",
      ).length;
    } else if (job.type === "collections" || job.type === "pages") {
      job.recordsProcessed = db.storeCatalogItems.filter(
        (item) => item.type === (job.type === "collections" ? "collection" : "page"),
      ).length;
      job.recordsUpdated = job.recordsProcessed;
      db.storeConnection.lastProductsSyncAt = now;
      db.storeConnection.collectionsSyncedCount = db.storeCatalogItems.filter(
        (item) => item.type === "collection",
      ).length;
    } else if (job.type === "discounts") {
      job.recordsProcessed = db.promoCodes.length;
      job.recordsUpdated = db.promoCodes.filter((code) => code.status === "active").length;
      db.storeConnection.lastDiscountSyncAt = now;
      db.storeConnection.discountsSyncedCount = job.recordsUpdated;
    } else if (job.type === "orders" || job.type === "attribution") {
      const recentRecords = db.webhookIngestionRecords.filter(
        (record) =>
          record.topic.startsWith("orders/") ||
          (job.type === "attribution" && record.topic === "discounts/update"),
      );
      job.recordsProcessed = recentRecords.length;
      job.recordsCreated = recentRecords.filter(
        (record) => record.status === "processed" && Boolean(record.conversionId),
      ).length;
      job.recordsFailed = recentRecords.filter(
        (record) => record.status === "failed",
      ).length;
      job.status = job.recordsFailed > 0 ? "partial" : "succeeded";
      db.storeConnection.lastOrdersSyncAt = now;
      db.storeConnection.lastWebhookAt =
        recentRecords[0]?.processedAt ?? recentRecords[0]?.receivedAt ?? now;
    }

    if (job.status === "running") {
      job.status = "succeeded";
    }
  }

  job.completedAt = now;
  job.updatedAt = now;
  job.cursor = `${job.type}:${now}`;
  db.storeConnection.updatedAt = now;
  refreshStoreConnectionHealth(db, now);

  return job;
}

function processWebhookRecord(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  record: WebhookIngestionRecord,
) {
  const now = new Date().toISOString();
  record.status = "processing";
  record.updatedAt = now;

  if (
    db.storeConnection.installState !== "installed" ||
    db.storeConnection.status !== "connected"
  ) {
    record.status = "failed";
    record.errorMessage =
      "Shopify store is not connected, so webhook intake cannot be processed.";
    record.processedAt = null;
    return record;
  }

  if (record.topic === "app/uninstalled") {
    db.storeConnection.installState = "not_installed";
    db.storeConnection.status = "not_connected";
    db.storeConnection.connectionHealth = "error";
    db.storeConnection.connectedAt = null;
    db.storeConnection.appEmbedEnabled = false;
    db.storeConnection.lastHealthError =
      "Shopify app uninstall event received. Reinstall is required.";
    db.storeConnection.lastWebhookAt = now;
    record.status = "processed";
    record.processedAt = now;
    record.errorMessage = null;
    return record;
  }

  if (record.topic === "discounts/update") {
    record.status = record.discountCode ? "processed" : "ignored";
    record.processedAt = now;
    record.errorMessage =
      record.status === "ignored" ? "No discount code was included in the event." : null;
    db.storeConnection.lastDiscountSyncAt = now;
    db.storeConnection.lastWebhookAt = now;
    return record;
  }

  const referralLink = record.referralCode
    ? db.referralLinks.find(
        (item) => item.code.toLowerCase() === record.referralCode?.toLowerCase(),
      ) ?? null
    : null;
  const promoCode = record.discountCode
    ? db.promoCodes.find(
        (item) => item.code.toLowerCase() === record.discountCode?.toLowerCase(),
      ) ?? null
    : null;

  if (
    referralLink &&
    promoCode &&
    db.programSettings.antiLeakEnabled &&
    db.programSettings.requireCodeOwnershipMatch &&
    referralLink.influencerId !== promoCode.influencerId
  ) {
    pushSuspiciousEvent(db, {
      influencerId: referralLink.influencerId,
      referralLinkId: referralLink.id,
      promoCodeId: promoCode.id,
      conversionId: null,
      type: "coupon_mismatch",
      severity: "high",
      status: "open",
      title: "Coupon ownership mismatch from Shopify order",
      detail:
        "Webhook order payload contains a referral code and discount code that belong to different affiliates.",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    });
    record.status = "failed";
    record.errorMessage =
      "Referral code and discount code point to different affiliates.";
    record.processedAt = null;
    db.storeConnection.lastWebhookAt = now;
    return record;
  }

  const influencerId = referralLink?.influencerId ?? promoCode?.influencerId ?? null;

  if (!influencerId) {
    record.status = "ignored";
    record.errorMessage =
      "No affiliate attribution match was found for the incoming store event.";
    record.processedAt = now;
    db.storeConnection.lastWebhookAt = now;
    return record;
  }

  if (db.conversions.some((conversion) => conversion.orderId === record.orderId)) {
    record.status = "ignored";
    record.errorMessage = "A conversion already exists for this Shopify order.";
    record.processedAt = now;
    db.storeConnection.lastWebhookAt = now;
    return record;
  }

  const influencer = getInfluencerOrThrow(db, influencerId);
  const campaignId = referralLink?.campaignId ?? promoCode?.campaignId ?? null;
  const commissionModel = resolveCommissionModel(db, influencer, campaignId);
  const orderAmount =
    typeof record.payloadSummary.orderAmount === "number"
      ? record.payloadSummary.orderAmount
      : 0;
  const attributionSource =
    referralLink && promoCode
      ? "hybrid"
      : promoCode
        ? "promo_code"
        : referralLink
          ? "link"
          : "manual";
  const conversionStatus = record.topic === "orders/paid" ? "approved" : "pending";
  const resolvedCurrency =
    record.payloadSummary.currency === "USD" ||
    record.payloadSummary.currency === "EUR" ||
    record.payloadSummary.currency === "GBP"
      ? record.payloadSummary.currency
      : db.programSettings.defaultCurrency;
  const conversion: Conversion = {
    id: uniqueId("conv"),
    influencerId: influencer.id,
    referralLinkId: referralLink?.id ?? null,
    promoCodeId: promoCode?.id ?? null,
    orderId: record.orderId ?? uniqueId("order"),
    customerEmail:
      typeof record.payloadSummary.customerEmail === "string"
        ? record.payloadSummary.customerEmail
        : null,
    orderAmount,
    currency: resolvedCurrency,
    commissionType: commissionModel.commissionType,
    commissionValue: commissionModel.commissionValue,
    commissionAmount: calculateCommission(
      orderAmount,
      commissionModel.commissionType,
      commissionModel.commissionValue,
    ),
    attributionSource,
    status: conversionStatus,
    createdAt: now,
    updatedAt: now,
  };

  db.conversions.push(conversion);
  record.influencerId = influencer.id;
  record.campaignId = campaignId;
  record.conversionId = conversion.id;
  record.status = "processed";
  record.errorMessage = null;
  record.processedAt = now;
  db.storeConnection.lastOrdersSyncAt = now;
  db.storeConnection.lastWebhookAt = now;

  if (
    db.programSettings.fraudReviewEnabled &&
    db.programSettings.blockSelfReferrals &&
    conversion.customerEmail?.toLowerCase() ===
      getProfileOrThrow(db, influencer.profileId).email.toLowerCase()
  ) {
    pushSuspiciousEvent(db, {
      influencerId: influencer.id,
      referralLinkId: conversion.referralLinkId,
      promoCodeId: conversion.promoCodeId,
      conversionId: conversion.id,
      type: "self_referral",
      severity: "high",
      status: "open",
      title: "Possible self-referral from Shopify order",
      detail:
        "Customer email from Shopify order matches the affiliate account email.",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    });
  }

  return record;
}

function buildInfluencerListItem(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencer: Influencer,
) {
  const profile = db.profiles.find((item) => item.id === influencer.profileId);
  const application = db.influencerApplications.find(
    (item) => item.id === influencer.applicationId,
  );
  const primaryReferralLink =
    db.referralLinks.find(
      (link) => link.influencerId === influencer.id && link.isPrimary,
    ) ?? null;
  const activityDates = [
    ...db.linkClicks
      .filter((click) => click.influencerId === influencer.id)
      .map((click) => click.createdAt),
    ...db.conversions
      .filter((conversion) => conversion.influencerId === influencer.id)
      .map((conversion) => conversion.createdAt),
    ...db.payouts
      .filter((payout) => payout.influencerId === influencer.id)
      .map((payout) => payout.createdAt),
  ].sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

  return {
    ...influencer,
    fullName: profile?.fullName ?? "Unknown affiliate",
    email: profile?.email ?? "",
    country: profile?.country ?? null,
    primaryPlatform: application?.primaryPlatform ?? "instagram",
    audienceSize: application?.audienceSize ?? "0-1k",
    applicationStatus: application?.status ?? "approved",
    stats: buildInfluencerStats(db, influencer.id),
    primaryReferralLink,
    lastActivityAt: activityDates[0] ?? null,
    activeCampaigns: db.campaigns.filter(
      (campaign) =>
        campaign.status === "active" &&
        campaignAppliesToInfluencer(campaign, influencer.id),
    ).length,
    promoCodesCount: db.promoCodes.filter(
      (promoCode) =>
        promoCode.influencerId === influencer.id && promoCode.status === "active",
    ).length,
  } satisfies InfluencerListItem;
}

function buildDashboardData(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  profile: Profile,
) {
  const application = findApplicationByProfileId(db.influencerApplications, profile.id);
  const influencer = findInfluencerByProfileId(db.influencers, profile.id);

  if (!application || !influencer || application.status !== "approved") {
    return null;
  }

  const clicks = db.linkClicks.filter((click) => click.influencerId === influencer.id);
  const conversions = db.conversions.filter(
    (conversion) => conversion.influencerId === influencer.id,
  );
  const payouts = byNewest(
    db.payouts.filter((payout) => payout.influencerId === influencer.id),
  );
  const referralLinks = db.referralLinks
    .filter((link) => link.influencerId === influencer.id)
    .map((link) => buildReferralLinkListItem(db, link))
    .sort((left, right) => {
      if (right.revenue !== left.revenue) {
        return right.revenue - left.revenue;
      }

      return right.clicks - left.clicks;
    });
  const promoCodes = byNewest(
    db.promoCodes
      .filter((promoCode) => promoCode.influencerId === influencer.id)
      .map((promoCode) => buildPromoCodeListItem(db, promoCode)),
  );
  const campaigns = db.campaigns
    .filter((campaign) => campaignAppliesToInfluencer(campaign, influencer.id))
    .map((campaign) => buildCampaignWorkspaceItem(db, campaign, influencer.id))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const promoAssets = buildPromoAssetsForInfluencer(db, influencer.id);
  const primaryReferralLink =
    db.referralLinks.find(
      (link) => link.influencerId === influencer.id && link.isPrimary,
    ) ?? null;
  const rewards = buildRewardsForInfluencer(db, influencer.id);
  const suspiciousEvents = buildSuspiciousEventsForInfluencer(db, influencer.id);

  return {
    profile,
    influencer,
    primaryReferralLink,
    stats: calculateDashboardStats(clicks, conversions),
    performance: buildPerformanceSeries(clicks, conversions),
    recentActivity: buildRecentActivity(
      clicks,
      conversions,
      payouts,
      db.referralLinks.filter((link) => link.influencerId === influencer.id),
    ),
    promoAssets,
    latestPayout: payouts[0] ?? null,
    payoutHistory: payouts,
    applicationStatus: application.status,
    programSettings: db.programSettings,
    referralLinks,
    promoCodes,
    campaigns,
    rewards,
    suspiciousEvents,
  } satisfies InfluencerDashboardData;
}

function buildAffiliateDetailData(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  influencerId: string,
) {
  const influencer = db.influencers.find((item) => item.id === influencerId);

  if (!influencer) {
    return null;
  }

  const influencerListItem = buildInfluencerListItem(db, influencer);
  const referralLinks = db.referralLinks
    .filter((link) => link.influencerId === influencer.id)
    .map((link) => buildReferralLinkListItem(db, link))
    .sort((left, right) => right.revenue - left.revenue);
  const promoCodes = byNewest(
    db.promoCodes
      .filter((promoCode) => promoCode.influencerId === influencer.id)
      .map((promoCode) => buildPromoCodeListItem(db, promoCode)),
  );
  const campaigns = db.campaigns
    .filter((campaign) => campaignAppliesToInfluencer(campaign, influencer.id))
    .map((campaign) => buildCampaignWorkspaceItem(db, campaign, influencer.id))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const promoAssets = buildPromoAssetsForInfluencer(db, influencer.id);
  const conversions = byNewest(
    db.conversions
      .filter((conversion) => conversion.influencerId === influencer.id)
      .map((conversion) => buildConversionListItem(db, conversion)),
  );
  const payouts = byNewest(
    db.payouts
      .filter((payout) => payout.influencerId === influencer.id)
      .map((payout) => buildPayoutListItem(db, payout)),
  );
  const rewards = buildRewardsForInfluencer(db, influencer.id);
  const suspiciousEvents = buildSuspiciousEventsForInfluencer(db, influencer.id);
  const recentActivity = buildRecentActivity(
    db.linkClicks.filter((click) => click.influencerId === influencer.id),
    db.conversions.filter((conversion) => conversion.influencerId === influencer.id),
    payouts,
    db.referralLinks.filter((link) => link.influencerId === influencer.id),
  );

  return {
    influencer: influencerListItem,
    application:
      db.influencerApplications.find((item) => item.id === influencer.applicationId) ?? null,
    referralLinks,
    promoCodes,
    campaigns,
    promoAssets,
    conversions,
    payouts,
    rewards,
    suspiciousEvents,
    recentActivity,
  } satisfies AffiliateDetailData;
}

function resolveCampaignAffiliateIds(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  input: Campaign,
) {
  return input.appliesToAll
    ? db.influencers.map((influencer) => influencer.id)
    : input.affiliateIds;
}

function syncCampaignRewards(
  db: Awaited<ReturnType<typeof readDemoDatabase>>,
  campaign: Campaign,
) {
  const now = new Date().toISOString();
  const assignedInfluencerIds = resolveCampaignAffiliateIds(db, campaign);
  const relatedRewards = db.rewards.filter((reward) => reward.campaignId === campaign.id);

  if (!db.programSettings.enableRewards || !campaign.bonusType || !campaign.bonusTitle) {
    relatedRewards.forEach((reward) => {
      if (reward.status === "available") {
        reward.status = "cancelled";
        reward.issuedAt = reward.issuedAt ?? now;
      }
    });
    return;
  }

  relatedRewards.forEach((reward) => {
    if (reward.status === "available") {
      reward.type = campaign.bonusType ?? reward.type;
      reward.title = campaign.bonusTitle ?? reward.title;
      reward.description =
        campaign.bonusDescription ?? campaign.bonusTitle ?? reward.description;
      reward.value = campaign.bonusValue ?? null;
    }

    if (
      reward.influencerId &&
      !assignedInfluencerIds.includes(reward.influencerId) &&
      reward.status === "available"
    ) {
      reward.status = "cancelled";
      reward.issuedAt = reward.issuedAt ?? now;
    }
  });

  assignedInfluencerIds.forEach((influencerId) => {
    const hasReward = relatedRewards.some(
      (reward) =>
        reward.influencerId === influencerId &&
        reward.status !== "cancelled",
    );

    if (hasReward) {
      return;
    }

    db.rewards.push({
      id: uniqueId("reward"),
      influencerId,
      campaignId: campaign.id,
      type: campaign.bonusType ?? "cash_bonus",
      title: campaign.bonusTitle ?? "Campaign reward",
      description:
        campaign.bonusDescription ?? campaign.bonusTitle ?? "Campaign reward",
      value: campaign.bonusValue ?? null,
      currency: db.programSettings.defaultCurrency,
      status: "available",
      issuedAt: null,
      createdAt: campaign.updatedAt,
    });
  });
}

export const demoRepository: Repository = {
  async getProgramSummary() {
    const db = await readDemoDatabase();

    return {
      totalCreators: db.influencers.length,
      activeCreators: db.influencers.filter((influencer) => influencer.isActive)
        .length,
      countries: new Set(
        db.profiles
          .filter((profile) => profile.role === "INFLUENCER")
          .map((profile) => profile.country)
          .filter(Boolean),
      ).size,
      defaultCommissionValue: db.programSettings.defaultCommissionValue,
    };
  },

  async listAffiliateInvites() {
    const db = await readDemoDatabase();
    return byNewest(db.affiliateInvites).map((invite) => buildAffiliateInviteListItem(db, invite));
  },

  async createAffiliateInvite(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const invitedEmail = input.invitedEmail?.trim().toLowerCase() || null;

      if (
        invitedEmail &&
        (emailExists(draft, invitedEmail) ||
          draft.authAccounts.some((account) => account.email.toLowerCase() === invitedEmail) ||
          draft.influencerApplications.some(
            (application) => application.email.toLowerCase() === invitedEmail,
          ))
      ) {
        throw new Error("Esiste già un account o una candidatura associata a questa email.");
      }

      const now = new Date().toISOString();
      const invite: AffiliateInvite = {
        id: uniqueId("invite"),
        token: uniqueId("invite"),
        createdByProfileId: actorProfileId,
        invitedName: input.invitedName?.trim() || null,
        invitedEmail,
        note: input.note?.trim() || null,
        campaignId: input.campaignId ?? null,
        commissionType: draft.programSettings.defaultCommissionType,
        commissionValue: draft.programSettings.defaultCommissionValue,
        payoutMethod: "paypal",
        expiresAt: input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        claimedAt: null,
        claimedProfileId: null,
        claimedApplicationId: null,
        claimedInfluencerId: null,
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      draft.affiliateInvites.push(invite);
      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "affiliate_invite",
        entityId: invite.id,
        action: "created",
        payload: {
          hasInvitedEmail: Boolean(invitedEmail),
          campaignAssigned: Boolean(invite.campaignId),
        },
        createdAt: now,
      });

      return {
        db: draft,
        value: buildAffiliateInviteListItem(draft, invite),
      };
    });
  },

  async getAffiliateInviteByToken(token) {
    const db = await readDemoDatabase();
    const invite = db.affiliateInvites.find((item) => item.token === token.trim()) ?? null;

    if (!invite) {
      return null;
    }

    const inviteItem = buildAffiliateInviteListItem(db, invite);

    return {
      id: invite.id,
      token: invite.token,
      invitedName: invite.invitedName,
      invitedEmail: invite.invitedEmail,
      note: invite.note,
      campaignId: invite.campaignId,
      campaignName: inviteItem.campaignName,
      commissionType: invite.commissionType,
      commissionValue: invite.commissionValue,
      expiresAt: invite.expiresAt,
      isExpired: inviteItem.isExpired,
      isClaimable: inviteItem.isClaimable,
    } satisfies AffiliateInvitePublicSummary;
  },

  async createApplication(input: ApplicationInput) {
    return updateDemoDatabase(async (draft) => {
      const email = input.email.trim().toLowerCase();
      const invite = input.inviteToken
        ? draft.affiliateInvites.find((item) => item.token === input.inviteToken?.trim()) ?? null
        : null;

      if (input.inviteToken && !invite) {
        throw new Error("Questo link invito non è valido.");
      }

      if (invite?.revokedAt) {
        throw new Error("Questo link invito non è più disponibile.");
      }

      if (invite?.claimedAt) {
        throw new Error("Questo link invito è già stato utilizzato.");
      }

      if (invite && isInviteExpired(invite)) {
        throw new Error("Questo link invito è scaduto.");
      }

      if (invite?.invitedEmail && invite.invitedEmail.toLowerCase() !== email) {
        throw new Error("Questo invito è riservato a un indirizzo email diverso.");
      }

      if (emailExists(draft, email)) {
        throw new Error("uuesta email è già in uso.");
      }

      if (
        draft.authAccounts.some(
          (account) => account.email.toLowerCase() === email,
        )
      ) {
        throw new Error("uuesta email è già in uso.");
      }

      const now = new Date().toISOString();
      const profileId = uniqueId("profile");
      const authUserId = uniqueId("auth");
      const applicationId = uniqueId("app");

      draft.profiles.push({
        id: profileId,
        authUserId,
        role: "INFLUENCER",
        fullName: input.fullName.trim(),
        email,
        avatarUrl: null,
        country: input.country.trim(),
        createdAt: now,
        updatedAt: now,
      });

      draft.authAccounts.push({
        id: uniqueId("auth_account"),
        profileId,
        email,
        passwordHash: hashPassword(input.password),
      });

      const application = {
        id: applicationId,
        profileId,
        authUserId,
        source: invite ? "affiliate_invite" : "public_application",
        inviteId: invite?.id ?? null,
        fullName: input.fullName.trim(),
        email,
        instagramHandle: normalizeHandle(input.instagramHandle) ?? "",
        tiktokHandle: normalizeHandle(input.tiktokHandle),
        youtubeHandle: normalizeHandle(input.youtubeHandle),
        primaryPlatform: input.primaryPlatform,
        audienceSize: input.audienceSize,
        country: input.country.trim(),
        niche: input.niche.trim(),
        message: input.message.trim(),
        consentAccepted: input.consentAccepted,
        status: invite ? ("approved" as const) : ("pending" as const),
        reviewedBy: invite?.createdByProfileId ?? null,
        reviewNotes: invite
          ? "Account creato da link invito merchant con attivazione immediata."
          : null,
        reviewedAt: invite ? now : null,
        createdAt: now,
        updatedAt: now,
      } satisfies InfluencerApplication;

      draft.influencerApplications.push(application);

      if (invite) {
        const profile = getProfileOrThrow(draft, profileId);
        const influencer = activateInfluencerFromApplication(draft, application, profile, {
          reviewerProfileId: invite.createdByProfileId,
          commissionType: invite.commissionType,
          commissionValue: invite.commissionValue,
          payoutMethod: invite.payoutMethod,
          reviewNotes: "Attivazione automatica da invito merchant.",
          campaignId: invite.campaignId,
          now,
        });

        invite.claimedAt = now;
        invite.claimedProfileId = profile.id;
        invite.claimedApplicationId = application.id;
        invite.claimedInfluencerId = influencer.id;
        invite.updatedAt = now;

        draft.auditLogs.push({
          id: uniqueId("audit"),
          actorProfileId: profile.id,
          entityType: "affiliate_invite",
          entityId: invite.id,
          action: "claimed",
          payload: {
            profileId: profile.id,
            influencerId: influencer.id,
          },
          createdAt: now,
        });
      }

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId: profileId,
        entityType: "application",
        entityId: applicationId,
        action: invite ? "created_from_invite" : "created",
        payload: {
          status: application.status,
          source: application.source,
        },
        createdAt: now,
      });

      return { db: draft, value: application };
    });
  },

  async authenticateWithPassword(input) {
    const db = await readDemoDatabase();
    const identifier = input.email.trim().toLowerCase();
    const account = db.authAccounts.find(
      (candidate) => {
        const candidateEmail = candidate.email.toLowerCase();

        if (candidateEmail === identifier) {
          return true;
        }

        if (candidateEmail.split("@")[0] === identifier) {
          return true;
        }

        const influencer = db.influencers.find((item) => item.profileId === candidate.profileId);
        return influencer?.publicSlug.toLowerCase() === identifier;
      },
    );

    if (!account) {
      return null;
    }

    if (account.passwordHash.length !== 64) {
      account.passwordHash = hashPassword(account.passwordHash);
    }

    if (!comparePassword(input.password, account.passwordHash)) {
      return null;
    }

    const profile = db.profiles.find((item) => item.id === account.profileId);

    if (!profile) {
      return null;
    }

    return {
      profileId: profile.id,
      role: profile.role,
      email: profile.email,
      fullName: profile.fullName,
      authUserId: profile.authUserId,
    } satisfies UserSession;
  },

  async getProfileById(profileId) {
    const db = await readDemoDatabase();
    return db.profiles.find((profile) => profile.id === profileId) ?? null;
  },

  async getProfileByAuthUserId(authUserId) {
    const db = await readDemoDatabase();
    return db.profiles.find((profile) => profile.authUserId === authUserId) ?? null;
  },

  async getApplicationStatusForProfile(profileId) {
    const db = await readDemoDatabase();
    const application = findApplicationByProfileId(db.influencerApplications, profileId);
    return application?.status ?? null;
  },

  async getInfluencerDashboard(profileId) {
    const db = await readDemoDatabase();
    const profile = db.profiles.find((candidate) => candidate.id === profileId);
    return profile ? buildDashboardData(db, profile) : null;
  },

  async getInfluencerSettings(profileId) {
    const db = await readDemoDatabase();
    const profile = db.profiles.find((candidate) => candidate.id === profileId);
    const influencer = profile
      ? findInfluencerByProfileId(db.influencers, profile.id)
      : null;

    if (!profile || !influencer) {
      return null;
    }

    return {
      profile,
      influencer,
      application: findApplicationByProfileId(db.influencerApplications, profile.id),
    } satisfies InfluencerSettingsData;
  },

  async updateInfluencerSettings(profileId, input) {
    return updateDemoDatabase(async (draft) => {
      const profile = getProfileOrThrow(draft, profileId);
      const influencer = findInfluencerByProfileId(draft.influencers, profileId);
      const application = findApplicationByProfileId(
        draft.influencerApplications,
        profileId,
      );

      profile.fullName = input.fullName.trim();
      profile.country = input.country.trim();
      profile.updatedAt = new Date().toISOString();

      if (!influencer || !application) {
      throw new Error("Account affiliato non trovato.");
      }

      influencer.payoutMethod = input.payoutMethod;
      influencer.payoutProviderStatus =
        input.payoutMethod === "paypal" ? "ready" : influencer.payoutProviderStatus;
      influencer.payoutEmail = input.payoutEmail.trim().toLowerCase();
      influencer.companyName = input.companyName?.trim() || null;
      influencer.taxId = input.taxId?.trim() || null;
      influencer.notificationEmail =
        input.notificationEmail?.trim().toLowerCase() || input.payoutEmail.trim().toLowerCase();
      influencer.notificationsEnabled = input.notificationsEnabled;
      influencer.updatedAt = profile.updatedAt;

      application.fullName = profile.fullName;
      application.country = input.country.trim();
      application.instagramHandle = normalizeHandle(input.instagramHandle) ?? "";
      application.tiktokHandle = normalizeHandle(input.tiktokHandle);
      application.youtubeHandle = normalizeHandle(input.youtubeHandle);
      application.updatedAt = profile.updatedAt;

      return {
        db: draft,
        value: {
          profile,
          influencer,
          application,
        } satisfies InfluencerSettingsData,
      };
    });
  },

  async getAdminOverview() {
    const db = await readDemoDatabase();
    const totalClicks = db.linkClicks.length;
    const activeConversions = db.conversions.filter(
      (conversion) => conversion.status !== "cancelled",
    );
    const totalRevenue = activeConversions.reduce(
      (sum, conversion) => sum + conversion.orderAmount,
      0,
    );
    const totalCommissionLiability = activeConversions
      .filter((conversion) => conversion.status !== "paid")
      .reduce((sum, conversion) => sum + conversion.commissionAmount, 0);
    const links = (await this.listReferralLinks()).slice(0, 5);
    const promoCodes = (await this.listPromoCodes("all")).slice(0, 5);

    return {
      kpis: {
        totalInfluencers: db.influencers.length,
        activeInfluencers: db.influencers.filter((influencer) => influencer.isActive)
          .length,
        pendingApplications: db.influencerApplications.filter(
          (application) => application.status === "pending",
        ).length,
        totalClicks,
        totalConversions: activeConversions.length,
        totalRevenue,
        totalCommissionLiability,
        pendingPromoCodeRequests: db.promoCodes.filter(
          (promoCode) => promoCode.status === "pending",
        ).length,
        activeCampaigns: db.campaigns.filter((campaign) => campaign.status === "active")
          .length,
        pendingPayouts: db.payouts.filter((payout) => payout.status !== "paid").length,
        openFraudFlags: db.suspiciousEvents.filter((event) => event.status === "open")
          .length,
      },
      performance: buildPerformanceSeries(db.linkClicks, db.conversions),
      recentApplications: (await this.listApplications("all")).slice(0, 4),
      topInfluencers: (await this.listInfluencers()).slice(0, 5),
      topLinks: links,
      topPromoCodes: promoCodes.sort((left, right) => right.revenue - left.revenue),
      suspiciousEvents: byNewest(db.suspiciousEvents).slice(0, 5),
      defaultCommissionValue: db.programSettings.defaultCommissionValue,
      programSettings: db.programSettings,
    };
  },

  async listApplications(status = "all") {
    const db = await readDemoDatabase();

    return byNewest(db.influencerApplications)
      .filter((application) => (status === "all" ? true : application.status === status))
      .map((application) => ({
        ...application,
        reviewerName:
          db.profiles.find((profile) => profile.id === application.reviewedBy)
            ?.fullName ?? null,
      }));
  },

  async approveApplication(applicationId, reviewerProfileId, input) {
    return updateDemoDatabase(async (draft) => {
      const application = getApplicationOrThrow(draft, applicationId);
      const now = new Date().toISOString();

      application.status = "approved";
      application.reviewedBy = reviewerProfileId;
      application.reviewNotes = input.reviewNotes?.trim() || null;
      application.reviewedAt = now;
      application.updatedAt = now;

      let profile = application.profileId
        ? draft.profiles.find((candidate) => candidate.id === application.profileId) ??
          null
        : null;

      if (!profile) {
        profile = {
          id: uniqueId("profile"),
          authUserId: application.authUserId,
          role: "INFLUENCER",
          fullName: application.fullName,
          email: application.email,
          avatarUrl: null,
          country: application.country,
          createdAt: now,
          updatedAt: now,
        };
        draft.profiles.push(profile);
        application.profileId = profile.id;
      }

      let influencer =
        draft.influencers.find((candidate) => candidate.profileId === profile.id) ??
        null;

      if (!influencer) {
        influencer = {
          id: uniqueId("inf"),
          profileId: profile.id,
          applicationId: application.id,
          publicSlug: generateReferralSlug(
            application.fullName,
            draft.influencers.map((item) => item.publicSlug),
          ),
          discountCode: generateDiscountCode(
            application.fullName,
            draft.influencers.map((item) => item.discountCode),
          ),
          commissionType: input.commissionType,
          commissionValue: input.commissionValue,
          isActive: true,
          payoutMethod: input.payoutMethod,
          payoutProviderStatus: input.payoutMethod === "paypal" ? "ready" : "not_connected",
          payoutEmail: application.email,
          companyName: null,
          taxId: null,
          notificationEmail: application.email,
          notificationsEnabled: true,
          notes: "",
          createdAt: now,
          updatedAt: now,
        };
        draft.influencers.push(influencer);
      } else {
        influencer.isActive = true;
        influencer.commissionType = input.commissionType;
        influencer.commissionValue = input.commissionValue;
        influencer.payoutMethod = input.payoutMethod;
        influencer.payoutProviderStatus =
          input.payoutMethod === "paypal" ? "ready" : influencer.payoutProviderStatus;
        influencer.updatedAt = now;
      }

      const primaryLink = draft.referralLinks.find(
        (link) => link.influencerId === influencer.id && link.isPrimary,
      );

      if (!primaryLink) {
        draft.referralLinks.push({
          id: uniqueId("link"),
          influencerId: influencer.id,
          name: "Link storefront principale",
          code: influencer.publicSlug,
          destinationUrl: `/shop?ref=${influencer.publicSlug}`,
          isPrimary: true,
          isActive: true,
          archivedAt: null,
          campaignId: null,
          utmSource: null,
          utmMedium: null,
          utmCampaign: null,
          createdAt: now,
        });
      }

      if (!draft.promoCodes.some((promoCode) => promoCode.influencerId === influencer.id && promoCode.isPrimary)) {
        draft.promoCodes.push({
          id: uniqueId("promo_code"),
          influencerId: influencer.id,
          campaignId: null,
          code: influencer.discountCode,
          discountValue: 10,
          status: "active",
          source: "assigned",
          isPrimary: true,
          requestMessage: null,
          approvedBy: reviewerProfileId,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (input.campaignId) {
        const campaign = getCampaignOrThrow(draft, input.campaignId);

        if (!campaign.appliesToAll && !campaign.affiliateIds.includes(influencer.id)) {
          campaign.affiliateIds.push(influencer.id);
          campaign.updatedAt = now;
        }

        if (
          draft.programSettings.enableRewards &&
          campaign.bonusType &&
          campaign.bonusTitle &&
          !draft.rewards.some(
            (reward) =>
              reward.influencerId === influencer.id && reward.campaignId === campaign.id,
          )
        ) {
          draft.rewards.push({
            id: uniqueId("reward"),
            influencerId: influencer.id,
            campaignId: campaign.id,
            type: campaign.bonusType,
            title: campaign.bonusTitle,
            description:
              campaign.bonusDescription ?? campaign.bonusTitle ?? "Campaign bonus",
            value: campaign.bonusValue ?? null,
            currency: draft.programSettings.defaultCurrency,
            status: "available",
            issuedAt: null,
            createdAt: now,
          });
        }
      }

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId: reviewerProfileId,
        entityType: "application",
        entityId: applicationId,
        action: "approved",
        payload: {
          influencerId: influencer.id,
          status: "approved",
          payoutMethod: input.payoutMethod,
          campaignId: input.campaignId ?? null,
        },
        createdAt: now,
      });

      return { db: draft, value: influencer };
    });
  },

  async rejectApplication(applicationId, reviewerProfileId, reason) {
    await updateDemoDatabase(async (draft) => {
      const application = getApplicationOrThrow(draft, applicationId);
      const now = new Date().toISOString();

      application.status = "rejected";
      application.reviewedBy = reviewerProfileId;
      application.reviewedAt = now;
      application.reviewNotes = reason ?? "Not a fit for the current program.";
      application.updatedAt = now;

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId: reviewerProfileId,
        entityType: "application",
        entityId: applicationId,
        action: "rejected",
        payload: { status: "rejected" },
        createdAt: now,
      });

      return { db: draft, value: undefined };
    });
  },

  async listInfluencers(search) {
    const db = await readDemoDatabase();
    const query = search?.trim().toLowerCase();

    return db.influencers
      .map((influencer) => buildInfluencerListItem(db, influencer))
      .filter((item) => {
        if (!query) {
          return true;
        }

        return [
          item.fullName,
          item.email,
          item.discountCode,
          item.publicSlug,
          item.country ?? "",
          item.primaryPlatform,
          item.audienceSize,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => right.stats.totalRevenue - left.stats.totalRevenue);
  },

  async getAffiliateDetail(influencerId) {
    const db = await readDemoDatabase();
    return buildAffiliateDetailData(db, influencerId);
  },

  async updateInfluencerAdmin(influencerId, input) {
    return updateDemoDatabase(async (draft) => {
      const influencer = getInfluencerOrThrow(draft, influencerId);
      const profile = getProfileOrThrow(draft, influencer.profileId);

      if (emailExists(draft, input.email.trim().toLowerCase(), profile.id)) {
      throw new Error("uuesta email è già assegnata a un altro profilo.");
      }

      profile.fullName = input.fullName.trim();
      profile.email = input.email.trim().toLowerCase();
      profile.country = input.country.trim();
      profile.updatedAt = new Date().toISOString();

      influencer.isActive = input.isActive;
      influencer.commissionType = input.commissionType;
      influencer.commissionValue = input.commissionValue;
      influencer.payoutMethod = input.payoutMethod;
      influencer.payoutEmail = input.payoutEmail.trim().toLowerCase();
      influencer.notes = input.notes?.trim() ?? "";
      influencer.updatedAt = profile.updatedAt;

      const application = draft.influencerApplications.find(
        (candidate) => candidate.id === influencer.applicationId,
      );

      if (application) {
        application.fullName = profile.fullName;
        application.email = profile.email;
        application.country = profile.country ?? "";
        application.updatedAt = profile.updatedAt;
      }

      return { db: draft, value: influencer };
    });
  },

  async listReferralLinks(search) {
    const db = await readDemoDatabase();
    const query = search?.trim().toLowerCase();

    return db.referralLinks
      .map((link) => buildReferralLinkListItem(db, link))
      .filter((item) => {
        if (!query) {
          return true;
        }

        return [
          item.name,
          item.code,
          item.destinationUrl,
          item.influencerName,
          item.campaignName ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => {
        if (right.revenue !== left.revenue) {
          return right.revenue - left.revenue;
        }

        return right.clicks - left.clicks;
      });
  },

  async createReferralLink(profileId, input) {
    return updateDemoDatabase(async (draft) => {
      const influencer = findInfluencerByProfileId(draft.influencers, profileId);

      if (!influencer) {
      throw new Error("Account affiliato non trovato.");
      }

      const destinationUrl = input.destinationUrl.trim();

      if (
        !isAllowedDestinationUrl(
          destinationUrl,
          draft.programSettings.allowedDestinationUrls,
        )
      ) {
      throw new Error("Questo URL di destinazione non è consentito per il programma.");
      }

      if (input.campaignId) {
        const campaign = getCampaignOrThrow(draft, input.campaignId);

        if (!campaignAppliesToInfluencer(campaign, influencer.id)) {
      throw new Error("uuesta campagna non e assegnata al tuo account affiliato.");
        }
      }

      const now = new Date().toISOString();
      const code = generateReferralSlug(
        `${influencer.publicSlug}-${input.name}`,
        draft.referralLinks.map((link) => link.code),
      );
      const destinationWithTracking = appendQueryParams(destinationUrl, {
        ref: influencer.publicSlug,
        utm_source: input.utmSource?.trim() || null,
        utm_medium: input.utmMedium?.trim() || null,
        utm_campaign: input.utmCampaign?.trim() || null,
      });
      const link: ReferralLink = {
        id: uniqueId("link"),
        influencerId: influencer.id,
        name: input.name.trim(),
        code,
        destinationUrl: destinationWithTracking,
        isPrimary: false,
        isActive: true,
        archivedAt: null,
        campaignId: input.campaignId ?? null,
        utmSource: input.utmSource?.trim() || null,
        utmMedium: input.utmMedium?.trim() || null,
        utmCampaign: input.utmCampaign?.trim() || null,
        createdAt: now,
      };

      draft.referralLinks.push(link);
      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId: profileId,
        entityType: "referral_link",
        entityId: link.id,
        action: "created",
        payload: { code: link.code },
        createdAt: now,
      });

      return { db: draft, value: link };
    });
  },

  async updateReferralLinkStatus(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const link = getReferralLinkOrThrow(draft, input.linkId);

      if (link.isPrimary && !input.isActive) {
      throw new Error("I link principali non possono essere disattivati.");
      }

      link.isActive = input.isActive;
      link.archivedAt = input.isActive ? null : new Date().toISOString();

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "referral_link",
        entityId: link.id,
        action: input.isActive ? "activated" : "deactivated",
        payload: { code: link.code, isActive: input.isActive },
        createdAt: new Date().toISOString(),
      });

      return { db: draft, value: link };
    });
  },

  async archiveReferralLink(profileId, linkId) {
    return updateDemoDatabase(async (draft) => {
      const influencer = findInfluencerByProfileId(draft.influencers, profileId);

      if (!influencer) {
      throw new Error("Account affiliato non trovato.");
      }

      const link = getReferralLinkOrThrow(draft, linkId);

      if (link.influencerId !== influencer.id) {
      throw new Error("Puoi archiviare solo i tuoi referral link.");
      }

      if (link.isPrimary) {
        throw new Error("I link principali non possono essere archiviati.");
      }

      link.isActive = false;
      link.archivedAt = new Date().toISOString();

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId: profileId,
        entityType: "referral_link",
        entityId: link.id,
        action: "archived",
        payload: { code: link.code },
        createdAt: link.archivedAt,
      });

      return { db: draft, value: link };
    });
  },

  async listPromoCodes(status = "all") {
    const db = await readDemoDatabase();

    return byNewest(db.promoCodes)
      .filter((promoCode) => (status === "all" ? true : promoCode.status === status))
      .map((promoCode) => buildPromoCodeListItem(db, promoCode));
  },

  async createPromoCodeForInfluencer(profileId, input) {
    return updateDemoDatabase(async (draft) => {
      const influencer = findInfluencerByProfileId(draft.influencers, profileId);

      if (!influencer) {
      throw new Error("Account affiliato non trovato.");
      }

      if (input.campaignId) {
        const campaign = getCampaignOrThrow(draft, input.campaignId);

        if (!campaignAppliesToInfluencer(campaign, influencer.id)) {
      throw new Error("uuesta campagna non e assegnata al tuo account affiliato.");
        }
      }

      const desiredCode = input.desiredCode?.trim() || "";
      const existingCodes = draft.promoCodes.map((promoCode) => promoCode.code);
      const now = new Date().toISOString();
      const requestedCode =
        desiredCode ||
        generatePromoCode(
          influencer.publicSlug,
          existingCodes,
          draft.programSettings.promoCodePrefix,
        );

      if (input.action === "generate" && !draft.programSettings.allowAffiliateCodeGeneration) {
      throw new Error("La generazione autonoma dei codici promo non e attiva al momento.");
      }

      if (input.action === "request" && !draft.programSettings.allowPromoCodeRequests) {
      throw new Error("Le richieste di codici promo sono attualmente chiuse.");
      }

      if (
        draft.promoCodes.some(
          (promoCode) =>
            promoCode.influencerId === influencer.id &&
            promoCode.code === sanitizePromoCode(requestedCode) &&
            promoCode.status !== "rejected",
        )
      ) {
      throw new Error("Questo codice promo esiste già nel tuo account.");
      }

      const promoCode: PromoCode = {
        id: uniqueId("promo_code"),
        influencerId: influencer.id,
        campaignId: input.campaignId ?? null,
        code: sanitizePromoCode(requestedCode),
        discountValue: 10,
        status: input.action === "generate" ? "active" : "pending",
        source: input.action === "generate" ? "generated" : "requested",
        isPrimary: false,
        requestMessage: input.requestMessage?.trim() || null,
        approvedBy: input.action === "generate" ? profileId : null,
        createdAt: now,
        updatedAt: now,
      };

      draft.promoCodes.push(promoCode);
      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId: profileId,
        entityType: "promo_code",
        entityId: promoCode.id,
        action: input.action === "generate" ? "generated" : "requested",
        payload: { code: promoCode.code, status: promoCode.status },
        createdAt: now,
      });

      return { db: draft, value: promoCode };
    });
  },

  async assignPromoCode(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const influencer = getInfluencerOrThrow(draft, input.influencerId);
      const now = new Date().toISOString();
      const code = input.code?.trim()
        ? sanitizePromoCode(input.code)
        : generatePromoCode(
            influencer.publicSlug,
            draft.promoCodes.map((promoCode) => promoCode.code),
            draft.programSettings.promoCodePrefix,
          );

      if (
        draft.promoCodes.some(
          (promoCode) => promoCode.code === code && promoCode.influencerId !== influencer.id,
        )
      ) {
      throw new Error("Questo codice promo è già assegnato altrove.");
      }

      if (input.campaignId) {
        getCampaignOrThrow(draft, input.campaignId);
      }

      if (input.isPrimary) {
        draft.promoCodes
          .filter((promoCode) => promoCode.influencerId === influencer.id)
          .forEach((promoCode) => {
            promoCode.isPrimary = false;
            promoCode.updatedAt = now;
          });
        influencer.discountCode = code;
        influencer.updatedAt = now;
      }

      const promoCode: PromoCode = {
        id: uniqueId("promo_code"),
        influencerId: influencer.id,
        campaignId: input.campaignId ?? null,
        code,
        discountValue: input.discountValue,
        status: "active",
        source: "assigned",
        isPrimary: input.isPrimary,
        requestMessage: null,
        approvedBy: actorProfileId,
        createdAt: now,
        updatedAt: now,
      };

      draft.promoCodes.push(promoCode);
      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "promo_code",
        entityId: promoCode.id,
        action: "assigned",
        payload: { code: promoCode.code, isPrimary: promoCode.isPrimary },
        createdAt: now,
      });

      return { db: draft, value: promoCode };
    });
  },

  async reviewPromoCode(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const promoCode = getPromoCodeOrThrow(draft, input.promoCodeId);
      const now = new Date().toISOString();

      if (input.status === "active") {
        const desired = input.finalCode?.trim() || promoCode.code;
        const finalCode = sanitizePromoCode(desired);

        if (
          draft.promoCodes.some(
            (item) => item.id !== promoCode.id && item.code === finalCode,
          )
        ) {
      throw new Error("Questo codice promo esiste già.");
        }

        promoCode.code = finalCode;
        promoCode.status = "active";
        promoCode.approvedBy = actorProfileId;
      } else {
        promoCode.status = input.status;
      }

      promoCode.updatedAt = now;

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "promo_code",
        entityId: promoCode.id,
        action: input.status,
        payload: { code: promoCode.code, status: promoCode.status },
        createdAt: now,
      });

      return { db: draft, value: promoCode };
    });
  },

  async listCampaigns() {
    const db = await readDemoDatabase();

    return byNewest(
      db.campaigns.map((campaign) => ({
        ...campaign,
        assetsCount: db.promoAssets.filter((asset) => asset.campaignId === campaign.id)
          .length,
        promoCodesCount: db.promoCodes.filter(
          (promoCode) => promoCode.campaignId === campaign.id,
        ).length,
        rewardsCount: db.rewards.filter((reward) => reward.campaignId === campaign.id).length,
        assignedAffiliateCount: campaign.appliesToAll
          ? db.influencers.length
          : campaign.affiliateIds.length,
      })),
    ) as CampaignListItem[];
  },

  async getStoreConnection(): Promise<StoreConnection> {
    const db = await readDemoDatabase();
    const evaluation = evaluateStoreConnectionHealth(
      db.storeConnection,
      db.storeSyncJobs,
      db.webhookIngestionRecords,
    );

    return {
      ...db.storeConnection,
      connectionHealth: evaluation.health,
      lastHealthError: evaluation.message,
      lastHealthCheckAt:
        db.storeConnection.lastHealthCheckAt ?? new Date().toISOString(),
    };
  },

  async listStoreCatalogItems() {
    const db = await readDemoDatabase();
    return byNewest(db.storeCatalogItems).sort((left, right) => {
      if (Number(right.isFeatured) !== Number(left.isFeatured)) {
        return Number(right.isFeatured) - Number(left.isFeatured);
      }

      return left.title.localeCompare(right.title);
    });
  },

  async listStoreSyncJobs() {
    const db = await readDemoDatabase();
    return byNewest(db.storeSyncJobs);
  },

  async triggerStoreSync(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const job = createStoreSyncJobRecord(draft, {
        type: input.type,
        mode: input.mode,
        triggeredBy: "merchant",
        requestedBy: actorProfileId,
        notes: input.notes ?? null,
      });

      draft.storeSyncJobs.push(job);
      runStoreSyncJob(draft, job);

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "store_sync_job",
        entityId: job.id,
        action: "triggered",
        payload: {
          type: job.type,
          mode: job.mode,
          status: job.status,
        },
        createdAt: job.updatedAt,
      });

      return { db: draft, value: job };
    });
  },

  async retryStoreSyncJob(jobId, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const originalJob = draft.storeSyncJobs.find((item) => item.id === jobId);

      if (!originalJob) {
      throw new Error("Job di sync non trovato.");
      }

      const retryJob = createStoreSyncJobRecord(draft, {
        type: originalJob.type,
        mode: "retry",
        triggeredBy: "retry",
        requestedBy: actorProfileId,
        notes: originalJob.notes,
        parentJobId: originalJob.id,
      });

      draft.storeSyncJobs.push(retryJob);
      runStoreSyncJob(draft, retryJob);

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "store_sync_job",
        entityId: retryJob.id,
        action: "retried",
        payload: {
          parentJobId: originalJob.id,
          type: retryJob.type,
          status: retryJob.status,
        },
        createdAt: retryJob.updatedAt,
      });

      return { db: draft, value: retryJob };
    });
  },

  async createCampaign(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error("Seleziona date campagna valide.");
      }

      if (endDate < startDate) {
      throw new Error("La data di fine campagna deve essere successiva alla data di inizio.");
      }

      const landingUrl = input.landingUrl.trim();

      if (
        !isAllowedDestinationUrl(landingUrl, draft.programSettings.allowedDestinationUrls)
      ) {
      throw new Error("Questo URL di landing non è consentito per il programma.");
      }

      const createdAt = new Date().toISOString();
      const campaign: Campaign = {
        id: uniqueId("campaign"),
        name: input.name.trim(),
        description: input.description.trim(),
        landingUrl,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: input.status,
        commissionType: input.commissionType === "default" ? null : input.commissionType,
        commissionValue:
          input.commissionType === "default" ? null : input.commissionValue ?? null,
        bonusTitle: input.bonusTitle?.trim() || null,
        bonusDescription: input.bonusDescription?.trim() || null,
        bonusType: input.bonusType ?? null,
        bonusValue: input.bonusValue ?? null,
        appliesToAll: input.appliesToAll,
        affiliateIds: input.appliesToAll
          ? []
          : draft.influencers
              .filter((influencer) => input.affiliateIds.includes(influencer.id))
              .map((influencer) => influencer.id),
        createdAt,
        updatedAt: createdAt,
      };

      draft.campaigns.push(campaign);
      syncCampaignRewards(draft, campaign);
      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "campaign",
        entityId: campaign.id,
        action: "created",
        payload: { status: campaign.status },
        createdAt,
      });

      return { db: draft, value: campaign };
    });
  },

  async updateCampaign(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      if (!input.id) {
      throw new Error("L'ID campagna e obbligatorio.");
      }

      const campaign = getCampaignOrThrow(draft, input.id);
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error("Seleziona date campagna valide.");
      }

      if (endDate < startDate) {
      throw new Error("La data di fine campagna deve essere successiva alla data di inizio.");
      }

      const landingUrl = input.landingUrl.trim();

      if (
        !isAllowedDestinationUrl(landingUrl, draft.programSettings.allowedDestinationUrls)
      ) {
      throw new Error("Questo URL di landing non è consentito per il programma.");
      }

      const updatedAt = new Date().toISOString();
      campaign.name = input.name.trim();
      campaign.description = input.description.trim();
      campaign.landingUrl = landingUrl;
      campaign.startDate = startDate.toISOString();
      campaign.endDate = endDate.toISOString();
      campaign.status = input.status;
      campaign.commissionType =
        input.commissionType === "default" ? null : input.commissionType;
      campaign.commissionValue =
        input.commissionType === "default" ? null : input.commissionValue ?? null;
      campaign.bonusTitle = input.bonusTitle?.trim() || null;
      campaign.bonusDescription = input.bonusDescription?.trim() || null;
      campaign.bonusType = input.bonusType ?? null;
      campaign.bonusValue = input.bonusValue ?? null;
      campaign.appliesToAll = input.appliesToAll;
      campaign.affiliateIds = input.appliesToAll
        ? []
        : draft.influencers
            .filter((influencer) => input.affiliateIds.includes(influencer.id))
            .map((influencer) => influencer.id);
      campaign.updatedAt = updatedAt;

      syncCampaignRewards(draft, campaign);

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "campaign",
        entityId: campaign.id,
        action: "updated",
        payload: {
          status: campaign.status,
          appliesToAll: campaign.appliesToAll,
          affiliateCount: campaign.appliesToAll ? draft.influencers.length : campaign.affiliateIds.length,
        },
        createdAt: updatedAt,
      });

      return { db: draft, value: campaign };
    });
  },

  async updateStoreConnection(input: StoreConnectionInput, actorProfileId: string) {
    return updateDemoDatabase(async (draft) => {
      const now = new Date().toISOString();
      const normalizedDomain = input.shopDomain.trim().toLowerCase();
      const storefrontUrl = input.storefrontUrl.trim();
      const defaultDestinationUrl = input.defaultDestinationUrl.trim();

      if (!draft.programSettings.allowedDestinationUrls.includes(defaultDestinationUrl)) {
        draft.programSettings.allowedDestinationUrls = Array.from(
          new Set([...draft.programSettings.allowedDestinationUrls, defaultDestinationUrl]),
        );
      }

      draft.storeConnection = {
        ...draft.storeConnection,
        storeName: input.storeName.trim(),
        shopDomain: normalizedDomain,
        storefrontUrl,
        defaultDestinationUrl,
        installState: input.installState,
        status: input.status,
        syncProductsEnabled: input.syncProductsEnabled,
        syncDiscountCodesEnabled: input.syncDiscountCodesEnabled,
        orderAttributionEnabled: input.orderAttributionEnabled,
        autoCreateDiscountCodes: input.autoCreateDiscountCodes,
        appEmbedEnabled: input.appEmbedEnabled,
        grantedScopes: Array.from(new Set(input.grantedScopes.map((value) => value.trim()))),
        installedAt:
          input.installState === "installed"
            ? draft.storeConnection.installedAt ?? now
            : input.installState === "not_installed"
              ? null
              : draft.storeConnection.installedAt,
        connectedAt:
          input.status === "connected"
            ? draft.storeConnection.connectedAt ?? now
            : input.status === "not_connected"
              ? null
              : draft.storeConnection.connectedAt,
        lastProductsSyncAt: input.syncProductsEnabled
          ? draft.storeConnection.lastProductsSyncAt ?? now
          : null,
        lastDiscountSyncAt: input.syncDiscountCodesEnabled
          ? draft.storeConnection.lastDiscountSyncAt ?? now
          : null,
        lastOrdersSyncAt: input.orderAttributionEnabled
          ? draft.storeConnection.lastOrdersSyncAt ?? now
          : null,
        productsSyncedCount: draft.storeCatalogItems.filter((item) => item.type === "product")
          .length,
        collectionsSyncedCount: draft.storeCatalogItems.filter(
          (item) => item.type === "collection",
        ).length,
        discountsSyncedCount: input.syncDiscountCodesEnabled
          ? draft.promoCodes.filter((code) => code.status === "active").length
          : 0,
        updatedAt: now,
      };

      try {
        const destination = new URL(defaultDestinationUrl);
        draft.programSettings.defaultReferralDestinationPath = `${destination.pathname}${destination.search}`;
      } catch {
        // Keep the existing fallback path when the URL cannot be parsed.
      }
      draft.programSettings.updatedAt = now;
      refreshStoreConnectionHealth(draft, now);

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "store_connection",
        entityId: draft.storeConnection.id,
        action: "updated",
        payload: {
          platform: draft.storeConnection.platform,
          shopDomain: draft.storeConnection.shopDomain,
          status: draft.storeConnection.status,
          installState: draft.storeConnection.installState,
        },
        createdAt: now,
      });

      return { db: draft, value: draft.storeConnection };
    });
  },

  async updateStoreCatalogRules(
    input: StoreCatalogRulesInput,
    actorProfileId: string,
  ) {
    return updateDemoDatabase(async (draft) => {
      const now = new Date().toISOString();
      const enabledDestinationUrls = Array.from(
        new Set(input.enabledDestinationUrls.map((value) => value.trim()).filter(Boolean)),
      );

      if (!enabledDestinationUrls.length) {
      throw new Error("Abilita almeno una destinazione per gli affiliati.");
      }

      const unknownDestination = enabledDestinationUrls.find(
        (destinationUrl) =>
          !draft.storeCatalogItems.some((item) => item.destinationUrl === destinationUrl),
      );

      if (unknownDestination) {
      throw new Error("Una delle destinazioni selezionate non fa parte del catalogo Shopify.");
      }

      if (!enabledDestinationUrls.includes(input.defaultDestinationUrl.trim())) {
      throw new Error("La destinazione predefinita deve essere abilitata anche per gli affiliati.");
      }

      draft.storeCatalogItems.forEach((item) => {
        item.isAffiliateEnabled = enabledDestinationUrls.includes(item.destinationUrl);
        item.updatedAt = now;
      });

      draft.programSettings.allowedDestinationUrls = enabledDestinationUrls;
      draft.programSettings.updatedAt = now;
      draft.storeConnection.defaultDestinationUrl = input.defaultDestinationUrl.trim();
      draft.storeConnection.updatedAt = now;
      refreshStoreConnectionHealth(draft, now);

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "store_catalog",
        entityId: draft.storeConnection.id,
        action: "updated",
        payload: {
          enabledDestinations: enabledDestinationUrls.length,
          defaultDestinationUrl: draft.storeConnection.defaultDestinationUrl,
        },
        createdAt: now,
      });

      return { db: draft, value: draft.storeConnection };
    });
  },

  async listWebhookIngestionRecords(status = "all") {
    const db = await readDemoDatabase();

    return byNewest(db.webhookIngestionRecords).filter((record) =>
      status === "all" ? true : record.status === status,
    );
  },

  async ingestStoreWebhook(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const now = new Date().toISOString();
      const record: WebhookIngestionRecord = {
        id: uniqueId("webhook"),
        connectionId: draft.storeConnection.id,
        topic: input.topic,
        shopDomain: draft.storeConnection.shopDomain,
        externalEventId: uniqueId("evt"),
        status: "received",
        attempts: 1,
        errorMessage: null,
        orderId: input.orderId.trim(),
        referralCode: input.referralCode?.trim() || null,
        discountCode: input.discountCode?.trim() || null,
        influencerId: null,
        campaignId: null,
        conversionId: null,
        receivedAt: now,
        processedAt: null,
        payloadSummary: {
          orderAmount: input.orderAmount ?? null,
          currency: input.currency,
          customerEmail: input.customerEmail?.trim() || null,
        },
        createdAt: now,
        updatedAt: now,
      };

      draft.webhookIngestionRecords.push(record);
      processWebhookRecord(draft, record);
      refreshStoreConnectionHealth(draft, now);

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "webhook_ingestion",
        entityId: record.id,
        action: "ingested",
        payload: {
          topic: record.topic,
          status: record.status,
          orderId: record.orderId ?? "",
        },
        createdAt: now,
      });

      return { db: draft, value: record };
    });
  },

  async retryWebhookIngestion(recordId, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const record = draft.webhookIngestionRecords.find((item) => item.id === recordId);

      if (!record) {
      throw new Error("Record di ingestione webhook non trovato.");
      }

      const now = new Date().toISOString();
      record.attempts += 1;
      record.errorMessage = null;
      record.updatedAt = now;
      processWebhookRecord(draft, record);
      refreshStoreConnectionHealth(draft, now);

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "webhook_ingestion",
        entityId: record.id,
        action: "retried",
        payload: {
          topic: record.topic,
          status: record.status,
        },
        createdAt: now,
      });

      return { db: draft, value: record };
    });
  },

  async updateProgramSettings(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      draft.programSettings.allowAffiliateCodeGeneration =
        input.allowAffiliateCodeGeneration;
      draft.programSettings.allowPromoCodeRequests = input.allowPromoCodeRequests;
      draft.programSettings.allowCustomLinkDestinations =
        input.allowCustomLinkDestinations;
      draft.programSettings.promoCodePrefix = sanitizePromoCode(input.promoCodePrefix);
      draft.programSettings.emailBrandName = input.emailBrandName.trim();
      draft.programSettings.emailReplyTo = input.emailReplyTo.trim().toLowerCase();
      draft.programSettings.antiLeakEnabled = input.antiLeakEnabled;
      draft.programSettings.blockSelfReferrals = input.blockSelfReferrals;
      draft.programSettings.requireCodeOwnershipMatch =
        input.requireCodeOwnershipMatch;
      draft.programSettings.fraudReviewEnabled = input.fraudReviewEnabled;
      draft.programSettings.maxClicksPerIpPerDay = input.maxClicksPerIpPerDay;
      draft.programSettings.maxConversionsPerIpPerDay =
        input.maxConversionsPerIpPerDay;
      draft.programSettings.enableRewards = input.enableRewards;
      draft.programSettings.enableStoreCredit = input.enableStoreCredit;
      draft.programSettings.enableMarketplace = input.enableMarketplace;
      draft.programSettings.enableMultiLevel = input.enableMultiLevel;
      draft.programSettings.enableMultiProgram = input.enableMultiProgram;
      draft.programSettings.enableAutoPayouts = input.enableAutoPayouts;
      draft.programSettings.allowedDestinationUrls = Array.from(
        new Set(
          input.allowedDestinationUrls
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      );
      draft.programSettings.updatedAt = new Date().toISOString();

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "program_settings",
        entityId: draft.programSettings.id,
        action: "updated",
        payload: {
          allowAffiliateCodeGeneration: input.allowAffiliateCodeGeneration,
          allowPromoCodeRequests: input.allowPromoCodeRequests,
          antiLeakEnabled: input.antiLeakEnabled,
        },
        createdAt: draft.programSettings.updatedAt,
      });

      return { db: draft, value: draft.programSettings };
    });
  },

  async listConversions() {
    const db = await readDemoDatabase();

    return byNewest(db.conversions).map((conversion) => buildConversionListItem(db, conversion));
  },

  async createConversion(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const influencer = getInfluencerOrThrow(draft, input.influencerId);
      const referralLinkId =
        input.referralLinkId ??
        draft.referralLinks.find(
          (link) => link.influencerId === influencer.id && link.isPrimary,
        )?.id ??
        null;
      const promoCode = input.promoCodeId
        ? getPromoCodeOrThrow(draft, input.promoCodeId)
        : null;

      if (
        promoCode &&
        draft.programSettings.antiLeakEnabled &&
        draft.programSettings.requireCodeOwnershipMatch &&
        promoCode.influencerId !== influencer.id
      ) {
      throw new Error("Il codice promo selezionato appartiene a un affiliato diverso.");
      }

      const now = input.createdAt ?? new Date().toISOString();
      const resolvedAttributionSource =
        input.attributionSource ??
        (referralLinkId && promoCode?.id
          ? "hybrid"
          : promoCode?.id
            ? "promo_code"
            : referralLinkId
              ? "link"
              : "manual");
      const conversion: Conversion = {
        id: uniqueId("conv"),
        influencerId: influencer.id,
        referralLinkId,
        promoCodeId: promoCode?.id ?? null,
        orderId: input.orderId.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        orderAmount: input.orderAmount,
        currency: input.currency,
        commissionType: input.commissionType,
        commissionValue: input.commissionValue,
        commissionAmount: calculateCommission(
          input.orderAmount,
          input.commissionType,
          input.commissionValue,
        ),
        attributionSource: resolvedAttributionSource,
        status: input.status,
        createdAt: now,
        updatedAt: now,
      };

      draft.conversions.push(conversion);

      if (
        draft.programSettings.fraudReviewEnabled &&
        draft.programSettings.blockSelfReferrals &&
        conversion.customerEmail?.toLowerCase() ===
          getProfileOrThrow(draft, influencer.profileId).email.toLowerCase()
      ) {
        pushSuspiciousEvent(draft, {
          influencerId: influencer.id,
          referralLinkId,
          promoCodeId: promoCode?.id ?? null,
          conversionId: conversion.id,
          type: "self_referral",
          severity: "high",
          status: "open",
          title: "Possible self-referral order",
          detail: "Customer email matches the affiliate email on a commissionable conversion.",
          reviewedBy: null,
          reviewedAt: null,
          createdAt: now,
        });
      }

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "conversion",
        entityId: conversion.id,
        action: "created",
        payload: {
          orderId: conversion.orderId,
          status: conversion.status,
          attributionSource: resolvedAttributionSource,
        },
        createdAt: now,
      });

      return { db: draft, value: conversion };
    });
  },

  async listSuspiciousEvents(status = "all", influencerId) {
    const db = await readDemoDatabase();

    return byNewest(db.suspiciousEvents)
      .filter((event) => (status === "all" ? true : event.status === status))
      .filter((event) => (influencerId ? event.influencerId === influencerId : true))
      .map((event) => buildSuspiciousEventListItem(db, event));
  },

  async reviewSuspiciousEvent(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const suspiciousEvent = getSuspiciousEventOrThrow(
        draft,
        input.suspiciousEventId,
      );
      suspiciousEvent.status = input.status;
      suspiciousEvent.reviewedBy = actorProfileId;
      suspiciousEvent.reviewedAt = new Date().toISOString();

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "suspicious_event",
        entityId: suspiciousEvent.id,
        action: input.status,
        payload: { type: suspiciousEvent.type, status: input.status },
        createdAt: suspiciousEvent.reviewedAt,
      });

      return { db: draft, value: suspiciousEvent };
    });
  },

  async createManualSuspiciousEvent(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      getInfluencerOrThrow(draft, input.influencerId);
      const createdAt = new Date().toISOString();
      const suspiciousEvent = {
        id: uniqueId("flag"),
        influencerId: input.influencerId,
        referralLinkId: null,
        promoCodeId: null,
        conversionId: null,
        type: "manual_review",
        severity: input.severity,
        status: "open",
        title: input.title.trim(),
        detail: input.detail.trim(),
        reviewedBy: null,
        reviewedAt: null,
        createdAt,
      } satisfies SuspiciousEvent;

      draft.suspiciousEvents.push(suspiciousEvent);
      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "suspicious_event",
        entityId: suspiciousEvent.id,
        action: "created",
        payload: { severity: suspiciousEvent.severity, type: suspiciousEvent.type },
        createdAt,
      });

      return { db: draft, value: suspiciousEvent };
    });
  },

  async listPayouts() {
    const db = await readDemoDatabase();
    return byNewest(db.payouts).map((payout) => buildPayoutListItem(db, payout));
  },

  async getPayoutDetail(payoutId) {
    const db = await readDemoDatabase();
    return buildPayoutDetailData(db, payoutId);
  },

  async createPayoutBatch(input: PayoutBatchInput, actorProfileId: string) {
    return updateDemoDatabase(async (draft) => {
      const influencer = getInfluencerOrThrow(draft, input.influencerId);
      const selectedConversions = input.conversionIds.map((conversionId) => {
        const conversion = draft.conversions.find((candidate) => candidate.id === conversionId);

        if (!conversion) {
      throw new Error("Una delle conversioni selezionate non esiste piu.");
        }

        return conversion;
      });

      if (!selectedConversions.length) {
        throw new Error("Seleziona almeno una conversione approvata.");
      }

      const invalidConversion = selectedConversions.find(
        (conversion) =>
          conversion.influencerId !== influencer.id ||
          conversion.status !== "approved" ||
          getActivePayoutAllocation(draft, conversion.id),
      );

      if (invalidConversion) {
        throw new Error(
          "Only approved conversions without an active payout allocation can be batched.",
        );
      }

      const now = new Date().toISOString();
      const payoutId = uniqueId("payout");
      const payout: Payout = {
        id: payoutId,
        influencerId: influencer.id,
        amount: Number(
          selectedConversions
            .reduce((sum, conversion) => sum + conversion.commissionAmount, 0)
            .toFixed(2),
        ),
        currency: selectedConversions[0]?.currency ?? draft.programSettings.defaultCurrency,
        status: input.status,
        method: input.method,
        reference: input.reference?.trim() || null,
        paidAt: input.status === "paid" ? now : null,
        createdAt: now,
      };

      draft.payouts.push(payout);
      selectedConversions.forEach((conversion) => {
        draft.payoutAllocations.push({
          id: uniqueId("payout_alloc"),
          payoutId,
          conversionId: conversion.id,
          influencerId: influencer.id,
          amount: conversion.commissionAmount,
          releasedAt: null,
          createdAt: now,
        });

        if (input.status === "paid") {
          conversion.status = "paid";
          conversion.updatedAt = now;
        }
      });

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "payout",
        entityId: payout.id,
        action: "created",
        payload: {
          status: payout.status,
          influencerId: influencer.id,
          conversionCount: selectedConversions.length,
        },
        createdAt: now,
      });

      return { db: draft, value: payout };
    });
  },

  async updatePayout(input) {
    return updateDemoDatabase(async (draft) => {
      const payout = draft.payouts.find((candidate) => candidate.id === input.payoutId);

      if (!payout) {
      throw new Error("Payout non trovato.");
      }

      if (payout.status === "paid" && input.status !== "paid") {
      throw new Error("I record payout pagati non possono tornare a uno stato non pagato.");
      }

      if (payout.status === "failed" && input.status !== "failed") {
      throw new Error("I batch payout falliti devono essere ricreati come nuovi record payout.");
      }

      const now = new Date().toISOString();
      payout.status = input.status;
      payout.reference = input.reference?.trim() || payout.reference;

      if (input.status === "paid" && !payout.paidAt) {
        payout.paidAt = now;
      }

      const allocations = draft.payoutAllocations.filter(
        (allocation) => allocation.payoutId === payout.id && allocation.releasedAt === null,
      );

      if (input.status === "paid") {
        allocations.forEach((allocation) => {
          const conversion = draft.conversions.find(
            (candidate) => candidate.id === allocation.conversionId,
          );

          if (conversion) {
            conversion.status = "paid";
            conversion.updatedAt = now;
          }
        });
      }

      if (input.status === "failed") {
        allocations.forEach((allocation) => {
          allocation.releasedAt = now;
          const conversion = draft.conversions.find(
            (candidate) => candidate.id === allocation.conversionId,
          );

          if (conversion && conversion.status !== "paid") {
            conversion.status = "approved";
            conversion.updatedAt = now;
          }
        });
      }

      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId: null,
        entityType: "payout",
        entityId: payout.id,
        action: input.status,
        payload: {
          status: payout.status,
          reference: payout.reference,
        },
        createdAt: now,
      });

      return { db: draft, value: payout };
    });
  },

  async listPromoAssets() {
    const db = await readDemoDatabase();
    return byNewest(db.promoAssets);
  },

  async upsertPromoAsset(input, actorProfileId) {
    return updateDemoDatabase(async (draft) => {
      const now = new Date().toISOString();

      if (input.campaignId) {
        getCampaignOrThrow(draft, input.campaignId);
      }

      if (input.id) {
        const existing = draft.promoAssets.find((asset) => asset.id === input.id);

        if (!existing) {
          throw new Error("Asset promo non trovato.");
        }

        existing.title = input.title.trim();
        existing.type = input.type;
        existing.fileUrl = input.fileUrl.trim();
        existing.description = input.description.trim();
        existing.caption = input.caption?.trim() || null;
        existing.instructions = input.instructions?.trim() || null;
        existing.campaignId = input.campaignId ?? null;
        existing.isActive = input.isActive;

        draft.auditLogs.push({
          id: uniqueId("audit"),
          actorProfileId,
          entityType: "promo_asset",
          entityId: existing.id,
          action: "updated",
          payload: { title: existing.title },
          createdAt: now,
        });

        return { db: draft, value: existing };
      }

      const asset = {
        id: uniqueId("asset"),
        title: input.title.trim(),
        type: input.type,
        fileUrl: input.fileUrl.trim(),
        description: input.description.trim(),
        caption: input.caption?.trim() || null,
        instructions: input.instructions?.trim() || null,
        campaignId: input.campaignId ?? null,
        isActive: input.isActive,
        createdAt: now,
      } satisfies PromoAsset;

      draft.promoAssets.push(asset);
      draft.auditLogs.push({
        id: uniqueId("audit"),
        actorProfileId,
        entityType: "promo_asset",
        entityId: asset.id,
        action: "created",
        payload: { title: asset.title },
        createdAt: now,
      });

      return { db: draft, value: asset };
    });
  },

  async trackReferralClick(input): Promise<TrackedReferralDestination | null> {
    return updateDemoDatabase(async (draft) => {
      const link =
        draft.referralLinks.find((item) => item.code === input.slug && item.isActive) ??
        draft.referralLinks.find(
          (item) => item.code === input.slug && item.isPrimary,
        ) ??
        null;

      if (!link) {
        return { db: draft, value: null };
      }

      const createdAt = new Date().toISOString();
      draft.linkClicks.push({
        id: uniqueId("click"),
        influencerId: link.influencerId,
        referralLinkId: link.id,
        visitorId: uniqueId("visitor"),
        referrer: input.referrer,
        userAgent: input.userAgent,
        ipHash: input.ipHash,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        createdAt,
      });

      if (draft.programSettings.fraudReviewEnabled && input.ipHash) {
        const startOfDay = createdAt.slice(0, 10);
        const sameDayClicks = draft.linkClicks.filter(
          (click) =>
            click.influencerId === link.influencerId &&
            click.ipHash === input.ipHash &&
            click.createdAt.slice(0, 10) === startOfDay,
        );

        if (sameDayClicks.length > draft.programSettings.maxClicksPerIpPerDay) {
          pushSuspiciousEvent(draft, {
            influencerId: link.influencerId,
            referralLinkId: link.id,
            promoCodeId: null,
            conversionId: null,
            type: "repeated_ip",
            severity: "medium",
            status: "open",
            title: "Repeated IP activity threshold reached",
            detail: "A single IP generated more clicks than the current daily threshold allows.",
            reviewedBy: null,
            reviewedAt: null,
            createdAt,
          });
        }
      }

      const activePromoCodes = byNewest(
        draft.promoCodes.filter(
          (promoCode) =>
            promoCode.influencerId === link.influencerId &&
            promoCode.status === "active",
        ),
      );
      const matchedPromoCode =
        activePromoCodes.find(
          (promoCode) =>
            Boolean(link.campaignId) && promoCode.campaignId === link.campaignId,
        ) ??
        activePromoCodes.find((promoCode) => promoCode.isPrimary) ??
        activePromoCodes[0] ??
        null;

      return {
        db: draft,
        value: {
          destinationUrl: link.destinationUrl,
          referralCode: link.code,
          promoCode: matchedPromoCode?.code ?? null,
        },
      };
    });
  },
};

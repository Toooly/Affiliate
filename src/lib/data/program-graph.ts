import {
  buildPerformanceSeries,
  buildRecentActivity,
  calculateDashboardStats,
} from "@/lib/data/analytics";
import type {
  AdminOverviewData,
  AffiliateDetailData,
  ApplicationListItem,
  Campaign,
  CampaignListItem,
  CampaignWorkspaceItem,
  Conversion,
  ConversionListItem,
  Influencer,
  InfluencerApplication,
  InfluencerAssetAccess,
  InfluencerDashboardData,
  InfluencerListItem,
  LinkClick,
  Payout,
  PayoutAllocation,
  PayoutAllocationListItem,
  PayoutDetailData,
  PayoutListItem,
  Profile,
  ProgramSettings,
  PromoAsset,
  PromoCode,
  PromoCodeListItem,
  ReferralLink,
  ReferralLinkListItem,
  Reward,
  SuspiciousEvent,
  SuspiciousEventListItem,
} from "@/lib/types";

export interface ProgramGraph {
  profiles: Profile[];
  applications: InfluencerApplication[];
  influencers: Influencer[];
  referralLinks: ReferralLink[];
  clicks: LinkClick[];
  conversions: Conversion[];
  payouts: Payout[];
  payoutAllocations: PayoutAllocation[];
  promoAssets: PromoAsset[];
  influencerAssetAccess: InfluencerAssetAccess[];
  promoCodes: PromoCode[];
  campaigns: Campaign[];
  rewards: Reward[];
  suspiciousEvents: SuspiciousEvent[];
}

function byNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function getCampaignForConversion(
  conversion: Conversion,
  referralLinkById: Map<string, ReferralLink>,
  promoCodeById: Map<string, PromoCode>,
) {
  const promoCodeCampaignId = conversion.promoCodeId
    ? promoCodeById.get(conversion.promoCodeId)?.campaignId ?? null
    : null;
  const referralLinkCampaignId = conversion.referralLinkId
    ? referralLinkById.get(conversion.referralLinkId)?.campaignId ?? null
    : null;

  return promoCodeCampaignId ?? referralLinkCampaignId ?? null;
}

function getAttributionLabel(source: Conversion["attributionSource"]) {
  switch (source) {
    case "hybrid":
      return "Link + codice promo";
    case "promo_code":
      return "Codice promo";
    case "link":
      return "Link";
    default:
      return "Manuale";
  }
}

function buildProfileMaps(graph: ProgramGraph) {
  const profileById = new Map(graph.profiles.map((profile) => [profile.id, profile]));
  const applicationById = new Map(
    graph.applications.map((application) => [application.id, application]),
  );
  const influencerById = new Map(
    graph.influencers.map((influencer) => [influencer.id, influencer]),
  );
  const influencerByProfileId = new Map(
    graph.influencers.map((influencer) => [influencer.profileId, influencer]),
  );
  const referralLinkById = new Map(
    graph.referralLinks.map((referralLink) => [referralLink.id, referralLink]),
  );
  const promoCodeById = new Map(
    graph.promoCodes.map((promoCode) => [promoCode.id, promoCode]),
  );
  const campaignById = new Map(
    graph.campaigns.map((campaign) => [campaign.id, campaign]),
  );
  const conversionById = new Map(
    graph.conversions.map((conversion) => [conversion.id, conversion]),
  );
  const payoutById = new Map(graph.payouts.map((payout) => [payout.id, payout]));

  return {
    profileById,
    applicationById,
    influencerById,
    influencerByProfileId,
    referralLinkById,
    promoCodeById,
    campaignById,
    conversionById,
    payoutById,
  };
}

export function campaignAppliesToInfluencer(
  campaign: Campaign,
  influencerId: string,
) {
  return campaign.appliesToAll || campaign.affiliateIds.includes(influencerId);
}

export function buildApplicationListItems(graph: ProgramGraph) {
  const { profileById } = buildProfileMaps(graph);

  return byNewest(graph.applications).map((application) => ({
    ...application,
    reviewerName: application.reviewedBy
      ? profileById.get(application.reviewedBy)?.fullName ?? null
      : null,
  })) satisfies ApplicationListItem[];
}

export function buildReferralLinkListItems(graph: ProgramGraph) {
  const { influencerById, profileById, campaignById } = buildProfileMaps(graph);

  return graph.referralLinks.map((referralLink) => {
    const influencer = influencerById.get(referralLink.influencerId);
    const profile = influencer ? profileById.get(influencer.profileId) : null;
    const clicks = graph.clicks.filter(
      (click) => click.referralLinkId === referralLink.id,
    );
    const conversions = graph.conversions.filter(
      (conversion) =>
        conversion.referralLinkId === referralLink.id &&
        conversion.status !== "cancelled",
    );

    return {
      ...referralLink,
      influencerName: profile?.fullName ?? "Unknown affiliate",
      influencerEmail: profile?.email ?? "",
      campaignName: referralLink.campaignId
        ? campaignById.get(referralLink.campaignId)?.name ?? null
        : null,
      clicks: clicks.length,
      conversions: conversions.length,
      revenue: conversions.reduce((sum, conversion) => sum + conversion.orderAmount, 0),
      commission: conversions.reduce(
        (sum, conversion) => sum + conversion.commissionAmount,
        0,
      ),
      lastClickAt: clicks
        .map((click) => click.createdAt)
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null,
      suspiciousEventsCount: graph.suspiciousEvents.filter(
        (event) => event.referralLinkId === referralLink.id,
      ).length,
    } satisfies ReferralLinkListItem;
  });
}

export function buildPromoCodeListItems(graph: ProgramGraph) {
  const { influencerById, profileById, campaignById } = buildProfileMaps(graph);

  return graph.promoCodes.map((promoCode) => {
    const influencer = influencerById.get(promoCode.influencerId);
    const profile = influencer ? profileById.get(influencer.profileId) : null;
    const conversions = graph.conversions.filter(
      (conversion) =>
        conversion.promoCodeId === promoCode.id && conversion.status !== "cancelled",
    );

    return {
      ...promoCode,
      influencerName: profile?.fullName ?? "Unknown affiliate",
      influencerEmail: profile?.email ?? "",
      campaignName: promoCode.campaignId
        ? campaignById.get(promoCode.campaignId)?.name ?? null
        : null,
      conversions: conversions.length,
      revenue: conversions.reduce((sum, conversion) => sum + conversion.orderAmount, 0),
      commission: conversions.reduce(
        (sum, conversion) => sum + conversion.commissionAmount,
        0,
      ),
      suspiciousEventsCount: graph.suspiciousEvents.filter(
        (event) => event.promoCodeId === promoCode.id,
      ).length,
    } satisfies PromoCodeListItem;
  });
}

export function buildCampaignListItems(graph: ProgramGraph) {
  return byNewest(graph.campaigns).map((campaign) => ({
    ...campaign,
    assetsCount: graph.promoAssets.filter((asset) => asset.campaignId === campaign.id).length,
    promoCodesCount: graph.promoCodes.filter((promoCode) => promoCode.campaignId === campaign.id)
      .length,
    assignedAffiliateCount: campaign.appliesToAll
      ? graph.influencers.length
      : campaign.affiliateIds.length,
    rewardsCount: graph.rewards.filter((reward) => reward.campaignId === campaign.id).length,
  })) satisfies CampaignListItem[];
}

export function buildCampaignWorkspaceItems(
  graph: ProgramGraph,
  influencerId: string,
) {
  const referralLinks = buildReferralLinkListItems(graph);

  return byNewest(graph.campaigns)
    .filter((campaign) => campaignAppliesToInfluencer(campaign, influencerId))
    .map((campaign) => ({
      ...campaign,
      assets: graph.promoAssets.filter((asset) => asset.campaignId === campaign.id),
      promoCodes: graph.promoCodes.filter(
        (promoCode) =>
          promoCode.influencerId === influencerId && promoCode.campaignId === campaign.id,
      ),
      referralLinks: referralLinks.filter(
        (referralLink) =>
          referralLink.influencerId === influencerId &&
          referralLink.campaignId === campaign.id,
      ),
      rewards: graph.rewards.filter(
        (reward) =>
          reward.campaignId === campaign.id &&
          (!reward.influencerId || reward.influencerId === influencerId),
      ),
      isAssigned: true,
    })) satisfies CampaignWorkspaceItem[];
}

function getAccessiblePromoAssets(graph: ProgramGraph, influencerId: string) {
  const assignedCampaignIds = new Set(
    graph.campaigns
      .filter((campaign) => campaignAppliesToInfluencer(campaign, influencerId))
      .map((campaign) => campaign.id),
  );
  const directAssetIds = new Set(
    graph.influencerAssetAccess
      .filter((access) => access.influencerId === influencerId)
      .map((access) => access.assetId),
  );

  return uniqueById(
    graph.promoAssets.filter(
      (promoAsset) =>
        directAssetIds.has(promoAsset.id) ||
        (promoAsset.campaignId ? assignedCampaignIds.has(promoAsset.campaignId) : false),
    ),
  ).filter((promoAsset) => promoAsset.isActive);
}

export function buildSuspiciousEventListItems(graph: ProgramGraph) {
  const { influencerById, profileById, referralLinkById, promoCodeById } =
    buildProfileMaps(graph);

  return byNewest(graph.suspiciousEvents).map((suspiciousEvent) => {
    const influencer = influencerById.get(suspiciousEvent.influencerId);
    const profile = influencer ? profileById.get(influencer.profileId) : null;

    return {
      ...suspiciousEvent,
      influencerName: profile?.fullName ?? "Unknown affiliate",
      referralCode: suspiciousEvent.referralLinkId
        ? referralLinkById.get(suspiciousEvent.referralLinkId)?.code ?? null
        : null,
      promoCode: suspiciousEvent.promoCodeId
        ? promoCodeById.get(suspiciousEvent.promoCodeId)?.code ?? null
        : null,
    } satisfies SuspiciousEventListItem;
  });
}

export function buildConversionListItems(graph: ProgramGraph) {
  const {
    influencerById,
    profileById,
    referralLinkById,
    promoCodeById,
    campaignById,
    payoutById,
  } = buildProfileMaps(graph);

  const allocationsByConversionId = new Map<string, PayoutAllocation[]>();
  for (const allocation of graph.payoutAllocations) {
    const list = allocationsByConversionId.get(allocation.conversionId) ?? [];
    list.push(allocation);
    allocationsByConversionId.set(allocation.conversionId, list);
  }

  return byNewest(graph.conversions).map((conversion) => {
    const influencer = influencerById.get(conversion.influencerId);
    const profile = influencer ? profileById.get(influencer.profileId) : null;
    const linkedPayouts = (allocationsByConversionId.get(conversion.id) ?? [])
      .map((allocation) => ({
        allocation,
        payout: payoutById.get(allocation.payoutId) ?? null,
      }))
      .filter((item) => item.payout);
    const activePayout =
      linkedPayouts.find((item) => item.allocation.releasedAt === null)?.payout ??
      linkedPayouts[0]?.payout ??
      null;
    const campaignId = getCampaignForConversion(
      conversion,
      referralLinkById,
      promoCodeById,
    );

    return {
      ...conversion,
      influencerName: profile?.fullName ?? "Unknown affiliate",
      referralCode: conversion.referralLinkId
        ? referralLinkById.get(conversion.referralLinkId)?.code ?? null
        : null,
      promoCode: conversion.promoCodeId
        ? promoCodeById.get(conversion.promoCodeId)?.code ?? null
        : null,
      campaignName: campaignId ? campaignById.get(campaignId)?.name ?? null : null,
      attributionLabel: getAttributionLabel(conversion.attributionSource),
      suspiciousEventsCount: graph.suspiciousEvents.filter(
        (event) => event.conversionId === conversion.id,
      ).length,
      payoutId: activePayout?.id ?? null,
      payoutStatus: activePayout?.status ?? null,
      payoutReference: activePayout?.reference ?? null,
      payoutCreatedAt: activePayout?.createdAt ?? null,
      isAllocated: linkedPayouts.some((item) => item.allocation.releasedAt === null),
    } satisfies ConversionListItem;
  });
}

export function buildPayoutListItems(graph: ProgramGraph) {
  const { influencerById, profileById, conversionById, referralLinkById, promoCodeById, campaignById } =
    buildProfileMaps(graph);

  return byNewest(graph.payouts).map((payout) => {
    const influencer = influencerById.get(payout.influencerId);
    const profile = influencer ? profileById.get(influencer.profileId) : null;
    const allocations = graph.payoutAllocations.filter(
      (allocation) => allocation.payoutId === payout.id,
    );
    const conversions = allocations
      .map((allocation) => conversionById.get(allocation.conversionId) ?? null)
      .filter((conversion): conversion is Conversion => Boolean(conversion));
    const campaignNames = Array.from(
      new Set(
        conversions
          .map((conversion) => {
            const campaignId = getCampaignForConversion(
              conversion,
              referralLinkById,
              promoCodeById,
            );

            return campaignId ? campaignById.get(campaignId)?.name ?? null : null;
          })
          .filter(Boolean),
      ),
    ) as string[];

    return {
      ...payout,
      influencerName: profile?.fullName ?? "Unknown affiliate",
      influencerEmail: profile?.email ?? "",
      allocationsCount: allocations.length,
      activeAllocationsCount: allocations.filter((allocation) => allocation.releasedAt === null)
        .length,
      coveredCommission: allocations.reduce((sum, allocation) => sum + allocation.amount, 0),
      coveredRevenue: conversions.reduce(
        (sum, conversion) => sum + conversion.orderAmount,
        0,
      ),
      releasedCommission: allocations
        .filter((allocation) => allocation.releasedAt !== null)
        .reduce((sum, allocation) => sum + allocation.amount, 0),
      campaignNames,
    } satisfies PayoutListItem;
  });
}

export function buildPayoutDetailData(graph: ProgramGraph, payoutId: string) {
  const { conversionById, payoutById, influencerById, profileById, referralLinkById, promoCodeById, campaignById } =
    buildProfileMaps(graph);
  const payout = payoutById.get(payoutId);

  if (!payout) {
    return null;
  }

  const payoutItems = buildPayoutListItems(graph);
  const payoutItem = payoutItems.find((item) => item.id === payoutId);
  const influencerItem = buildInfluencerListItems(graph).find(
    (item) => item.id === payout.influencerId,
  );

  if (!payoutItem || !influencerItem) {
    return null;
  }

  const allocations = graph.payoutAllocations.filter(
    (allocation) => allocation.payoutId === payout.id,
  );
  const allocationItems = allocations.map((allocation) => {
    const conversion = conversionById.get(allocation.conversionId);
    const influencer = influencerById.get(allocation.influencerId);
    const profile = influencer ? profileById.get(influencer.profileId) : null;
    const campaignName = conversion
      ? (() => {
          const campaignId = getCampaignForConversion(
            conversion,
            referralLinkById,
            promoCodeById,
          );

          return campaignId ? campaignById.get(campaignId)?.name ?? null : null;
        })()
      : null;

    return {
      ...allocation,
      influencerName: profile?.fullName ?? "Unknown affiliate",
      orderId: conversion?.orderId ?? "Unknown order",
      orderAmount: conversion?.orderAmount ?? 0,
      currency: conversion?.currency ?? payout.currency,
      commissionAmount: conversion?.commissionAmount ?? allocation.amount,
      conversionStatus: conversion?.status ?? "approved",
      campaignName,
      referralCode: conversion?.referralLinkId
        ? referralLinkById.get(conversion.referralLinkId)?.code ?? null
        : null,
      promoCode: conversion?.promoCodeId
        ? promoCodeById.get(conversion.promoCodeId)?.code ?? null
        : null,
    } satisfies PayoutAllocationListItem;
  });

  const activeAllocatedConversionIds = new Set(
    graph.payoutAllocations
      .filter((allocation) => allocation.releasedAt === null)
      .map((allocation) => allocation.conversionId),
  );
  const availableConversions = buildConversionListItems(graph).filter(
    (conversion) =>
      conversion.influencerId === payout.influencerId &&
      conversion.status === "approved" &&
      !activeAllocatedConversionIds.has(conversion.id),
  );

  return {
    payout: payoutItem,
    influencer: influencerItem,
    allocations: allocationItems,
    availableConversions,
    totals: {
      coveredCommission: payoutItem.coveredCommission,
      coveredRevenue: payoutItem.coveredRevenue,
      releasedCommission: payoutItem.releasedCommission,
      openApprovedCommission: buildConversionListItems(graph)
        .filter(
          (conversion) =>
            conversion.influencerId === payout.influencerId &&
            conversion.status === "approved" &&
            !activeAllocatedConversionIds.has(conversion.id),
        )
        .reduce((sum, conversion) => sum + conversion.commissionAmount, 0),
      paidCommission: graph.conversions
        .filter(
          (conversion) =>
            conversion.influencerId === payout.influencerId &&
            conversion.status === "paid",
        )
        .reduce((sum, conversion) => sum + conversion.commissionAmount, 0),
    },
  } satisfies PayoutDetailData;
}

export function buildInfluencerListItems(graph: ProgramGraph) {
  const { profileById, applicationById } = buildProfileMaps(graph);

  return graph.influencers
    .map((influencer) => {
      const profile = profileById.get(influencer.profileId);
      const application = influencer.applicationId
        ? applicationById.get(influencer.applicationId) ?? null
        : graph.applications.find(
            (candidate) => candidate.profileId === influencer.profileId,
          ) ?? null;
      const clicks = graph.clicks.filter((click) => click.influencerId === influencer.id);
      const conversions = graph.conversions.filter(
        (conversion) => conversion.influencerId === influencer.id,
      );
      const payouts = graph.payouts.filter((payout) => payout.influencerId === influencer.id);
      const activity = [...clicks, ...conversions, ...payouts].sort(
        (left, right) =>
          new Date(
            "paidAt" in right ? right.paidAt ?? right.createdAt : right.createdAt,
          ).getTime() -
          new Date(
            "paidAt" in left ? left.paidAt ?? left.createdAt : left.createdAt,
          ).getTime(),
      );

      return {
        ...influencer,
        fullName: profile?.fullName ?? "Unknown affiliate",
        email: profile?.email ?? "",
        country: profile?.country ?? null,
        primaryPlatform: application?.primaryPlatform ?? "instagram",
        audienceSize: application?.audienceSize ?? "0-1k",
        applicationStatus: application?.status ?? "approved",
        stats: calculateDashboardStats(clicks, conversions),
        primaryReferralLink:
          graph.referralLinks.find(
            (referralLink) =>
              referralLink.influencerId === influencer.id && referralLink.isPrimary,
          ) ?? null,
        lastActivityAt:
          activity[0] &&
          ("paidAt" in activity[0]
            ? activity[0].paidAt ?? activity[0].createdAt
            : activity[0].createdAt),
        activeCampaigns: graph.campaigns.filter(
          (campaign) =>
            campaign.status === "active" && campaignAppliesToInfluencer(campaign, influencer.id),
        ).length,
        promoCodesCount: graph.promoCodes.filter(
          (promoCode) => promoCode.influencerId === influencer.id,
        ).length,
      } satisfies InfluencerListItem;
    })
    .sort((left, right) => right.stats.totalRevenue - left.stats.totalRevenue);
}

export function buildInfluencerDashboardData(
  graph: ProgramGraph,
  profileId: string,
  programSettings: ProgramSettings,
) {
  const { profileById, influencerByProfileId } = buildProfileMaps(graph);
  const profile = profileById.get(profileId) ?? null;
  const influencer = influencerByProfileId.get(profileId) ?? null;
  const application =
    graph.applications
      .filter((candidate) => candidate.profileId === profileId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )[0] ?? null;

  if (!profile || !influencer || !application || application.status !== "approved") {
    return null;
  }

  const referralLinks = buildReferralLinkListItems(graph).filter(
    (referralLink) => referralLink.influencerId === influencer.id,
  );
  const promoCodes = buildPromoCodeListItems(graph).filter(
    (promoCode) => promoCode.influencerId === influencer.id,
  );
  const campaigns = buildCampaignWorkspaceItems(graph, influencer.id);
  const clicks = graph.clicks.filter((click) => click.influencerId === influencer.id);
  const conversions = graph.conversions.filter(
    (conversion) => conversion.influencerId === influencer.id,
  );
  const payouts = graph.payouts.filter((payout) => payout.influencerId === influencer.id);
  const payoutHistory = byNewest(payouts);
  const promoAssets = getAccessiblePromoAssets(graph, influencer.id);
  const suspiciousEvents = byNewest(
    graph.suspiciousEvents.filter((event) => event.influencerId === influencer.id),
  );
  const rewards = byNewest(
    graph.rewards.filter(
      (reward) =>
        reward.influencerId === influencer.id ||
        (!reward.influencerId &&
          campaigns.some((campaign) => campaign.id === reward.campaignId)),
    ),
  );

  return {
    profile,
    influencer,
    primaryReferralLink: referralLinks.find((referralLink) => referralLink.isPrimary) ?? null,
    stats: calculateDashboardStats(clicks, conversions),
    performance: buildPerformanceSeries(clicks, conversions),
    recentActivity: buildRecentActivity(
      clicks,
      conversions,
      payoutHistory,
      graph.referralLinks.filter((referralLink) => referralLink.influencerId === influencer.id),
    ),
    promoAssets,
    latestPayout: payoutHistory[0] ?? null,
    payoutHistory,
    applicationStatus: application.status,
    programSettings,
    referralLinks,
    promoCodes,
    campaigns,
    rewards,
    suspiciousEvents,
  } satisfies InfluencerDashboardData;
}

export function buildAffiliateDetailData(graph: ProgramGraph, influencerId: string) {
  const influencer = buildInfluencerListItems(graph).find((item) => item.id === influencerId);

  if (!influencer) {
    return null;
  }

  const application =
    graph.applications.find((candidate) => candidate.id === influencer.applicationId) ?? null;

  return {
    influencer,
    application,
    referralLinks: buildReferralLinkListItems(graph).filter(
      (referralLink) => referralLink.influencerId === influencerId,
    ),
    promoCodes: buildPromoCodeListItems(graph).filter(
      (promoCode) => promoCode.influencerId === influencerId,
    ),
    campaigns: buildCampaignWorkspaceItems(graph, influencerId),
    promoAssets: getAccessiblePromoAssets(graph, influencerId),
    conversions: buildConversionListItems(graph).filter(
      (conversion) => conversion.influencerId === influencerId,
    ),
    payouts: buildPayoutListItems(graph).filter(
      (payout) => payout.influencerId === influencerId,
    ),
    rewards: byNewest(
      graph.rewards.filter(
        (reward) =>
          reward.influencerId === influencerId ||
          (!reward.influencerId &&
            graph.campaigns.some(
              (campaign) =>
                campaign.id === reward.campaignId &&
                campaignAppliesToInfluencer(campaign, influencerId),
            )),
      ),
    ),
    suspiciousEvents: byNewest(
      graph.suspiciousEvents.filter((event) => event.influencerId === influencerId),
    ),
    recentActivity: buildRecentActivity(
      graph.clicks.filter((click) => click.influencerId === influencerId),
      graph.conversions.filter((conversion) => conversion.influencerId === influencerId),
      graph.payouts.filter((payout) => payout.influencerId === influencerId),
      graph.referralLinks.filter((referralLink) => referralLink.influencerId === influencerId),
    ),
  } satisfies AffiliateDetailData;
}

export function buildAdminOverviewData(
  graph: ProgramGraph,
  programSettings: ProgramSettings,
) {
  const applications = buildApplicationListItems(graph);
  const influencers = buildInfluencerListItems(graph);
  const referralLinks = buildReferralLinkListItems(graph).sort((left, right) => {
    if (right.revenue !== left.revenue) {
      return right.revenue - left.revenue;
    }

    return right.clicks - left.clicks;
  });
  const promoCodes = buildPromoCodeListItems(graph).sort((left, right) => {
    if (right.revenue !== left.revenue) {
      return right.revenue - left.revenue;
    }

    return right.conversions - left.conversions;
  });
  const openSuspiciousEvents = byNewest(
    graph.suspiciousEvents.filter((event) => event.status === "open"),
  );

  return {
    kpis: {
      totalInfluencers: influencers.length,
      activeInfluencers: influencers.filter((influencer) => influencer.isActive).length,
      pendingApplications: applications.filter((application) => application.status === "pending")
        .length,
      totalClicks: graph.clicks.length,
      totalConversions: graph.conversions.filter(
        (conversion) => conversion.status !== "cancelled",
      ).length,
      totalRevenue: graph.conversions
        .filter((conversion) => conversion.status !== "cancelled")
        .reduce((sum, conversion) => sum + conversion.orderAmount, 0),
      totalCommissionLiability: graph.conversions
        .filter(
          (conversion) =>
            conversion.status !== "cancelled" && conversion.status !== "paid",
        )
        .reduce((sum, conversion) => sum + conversion.commissionAmount, 0),
      pendingPromoCodeRequests: graph.promoCodes.filter(
        (promoCode) => promoCode.status === "pending",
      ).length,
      activeCampaigns: graph.campaigns.filter((campaign) => campaign.status === "active").length,
      pendingPayouts: graph.payouts.filter(
        (payout) => payout.status !== "paid" && payout.status !== "failed",
      ).length,
      openFraudFlags: openSuspiciousEvents.length,
    },
    performance: buildPerformanceSeries(graph.clicks, graph.conversions),
    recentApplications: applications.slice(0, 4),
    topInfluencers: influencers.slice(0, 5),
    topLinks: referralLinks.slice(0, 5),
    topPromoCodes: promoCodes.slice(0, 5),
    suspiciousEvents: openSuspiciousEvents.slice(0, 5),
    defaultCommissionValue: programSettings.defaultCommissionValue,
    programSettings,
  } satisfies AdminOverviewData;
}

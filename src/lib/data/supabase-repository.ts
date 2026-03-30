import {
  buildAdminOverviewData,
  buildAffiliateDetailData,
  buildCampaignListItems,
  buildConversionListItems,
  buildInfluencerDashboardData,
  buildInfluencerListItems,
  buildPayoutDetailData,
  buildPayoutListItems,
  buildPromoCodeListItems,
  buildReferralLinkListItems,
  buildSuspiciousEventListItems,
  campaignAppliesToInfluencer,
  type ProgramGraph,
} from "@/lib/data/program-graph";
import {
  getPrimaryLiveStoreConnection,
  listLiveStoreCatalogItems,
  listLiveStoreSyncJobs,
  listLiveWebhookIngestionRecords,
  persistIncomingWebhook,
  retryLiveStoreSync,
  retryLiveWebhookRecord,
  runLiveStoreSync,
} from "@/lib/shopify-bridge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AdminPromoCodeInput,
  AffiliateDetailData,
  ApplicationInput,
  ApplicationListItem,
  Campaign,
  CampaignInput,
  CampaignListItem,
  ClickTrackingInput,
  Conversion,
  Influencer,
  InfluencerApplication,
  InfluencerAssetAccess,
  InfluencerSettingsData,
  Payout,
  PayoutAllocation,
  PayoutBatchInput,
  PayoutDetailData,
  Profile,
  ProgramSettings,
  ProgramSettingsInput,
  PromoAsset,
  PromoCode,
  PromoCodeCreateInput,
  PromoCodeListItem,
  ReferralLink,
  ReferralLinkInput,
  ReferralLinkListItem,
  Repository,
  PromoCodeReviewInput,
  ReferralLinkStatusInput,
  Reward,
  StoreCatalogItem,
  StoreCatalogRulesInput,
  StoreConnection,
  StoreConnectionInput,
  StoreSyncJob,
  StoreSyncJobInput,
  SuspiciousEvent,
  UserSession,
  WebhookIngestionRecord,
  WebhookProcessingStatus,
  StoreWebhookIngestionInput,
} from "@/lib/types";
import {
  appendQueryParams,
  calculateCommission,
  createAbsoluteUrl,
  generateDiscountCode,
  generatePromoCode,
  generateReferralSlug,
  isAllowedDestinationUrl,
  normalizeHandle,
  sanitizePromoCode,
} from "@/lib/utils";

function ensureData<T>(data: T | null, error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    authUserId: row.auth_user_id ? String(row.auth_user_id) : null,
    role: String(row.role) as Profile["role"],
    fullName: String(row.full_name),
    email: String(row.email),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    country: row.country ? String(row.country) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapApplication(row: Record<string, unknown>): InfluencerApplication {
  return {
    id: String(row.id),
    profileId: row.profile_id ? String(row.profile_id) : null,
    authUserId: row.auth_user_id ? String(row.auth_user_id) : null,
    fullName: String(row.full_name),
    email: String(row.email),
    instagramHandle: String(row.instagram_handle),
    tiktokHandle: row.tiktok_handle ? String(row.tiktok_handle) : null,
    youtubeHandle: row.youtube_handle ? String(row.youtube_handle) : null,
    primaryPlatform: String(row.primary_platform) as InfluencerApplication["primaryPlatform"],
    audienceSize: String(row.audience_size) as InfluencerApplication["audienceSize"],
    country: String(row.country),
    niche: String(row.niche),
    message: String(row.message),
    consentAccepted: Boolean(row.consent_accepted),
    status: String(row.status) as InfluencerApplication["status"],
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewNotes: row.review_notes ? String(row.review_notes) : null,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapInfluencer(row: Record<string, unknown>): Influencer {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    applicationId: row.application_id ? String(row.application_id) : null,
    publicSlug: String(row.public_slug),
    discountCode: String(row.discount_code),
    commissionType: String(row.commission_type) as Influencer["commissionType"],
    commissionValue: Number(row.commission_value),
    isActive: Boolean(row.is_active),
    payoutMethod: row.payout_method
      ? (String(row.payout_method) as Influencer["payoutMethod"])
      : null,
    payoutProviderStatus: row.payout_provider_status
      ? (String(row.payout_provider_status) as Influencer["payoutProviderStatus"])
      : "not_connected",
    payoutEmail: row.payout_email ? String(row.payout_email) : null,
    companyName: row.company_name ? String(row.company_name) : null,
    taxId: row.tax_id ? String(row.tax_id) : null,
    notificationEmail: row.notification_email ? String(row.notification_email) : null,
    notificationsEnabled:
      row.notifications_enabled === undefined ? true : Boolean(row.notifications_enabled),
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapReferralLink(row: Record<string, unknown>): ReferralLink {
  return {
    id: String(row.id),
    influencerId: String(row.influencer_id),
    name: row.name ? String(row.name) : "Link storefront principale",
    code: String(row.code),
    destinationUrl: String(row.destination_url),
    isPrimary: Boolean(row.is_primary),
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    utmSource: row.utm_source ? String(row.utm_source) : null,
    utmMedium: row.utm_medium ? String(row.utm_medium) : null,
    utmCampaign: row.utm_campaign ? String(row.utm_campaign) : null,
    createdAt: String(row.created_at),
  };
}

function mapLinkClick(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    influencerId: String(row.influencer_id),
    referralLinkId: row.referral_link_id ? String(row.referral_link_id) : null,
    visitorId: String(row.visitor_id),
    referrer: row.referrer ? String(row.referrer) : null,
    userAgent: row.user_agent ? String(row.user_agent) : null,
    ipHash: row.ip_hash ? String(row.ip_hash) : null,
    utmSource: row.utm_source ? String(row.utm_source) : null,
    utmMedium: row.utm_medium ? String(row.utm_medium) : null,
    utmCampaign: row.utm_campaign ? String(row.utm_campaign) : null,
    createdAt: String(row.created_at),
  };
}

function mapConversion(row: Record<string, unknown>): Conversion {
  return {
    id: String(row.id),
    influencerId: String(row.influencer_id),
    referralLinkId: row.referral_link_id ? String(row.referral_link_id) : null,
    promoCodeId: row.promo_code_id ? String(row.promo_code_id) : null,
    orderId: String(row.order_id),
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    orderAmount: Number(row.order_amount),
    currency: String(row.currency) as Conversion["currency"],
    commissionType: String(row.commission_type) as Conversion["commissionType"],
    commissionValue: Number(row.commission_value),
    commissionAmount: Number(row.commission_amount),
    attributionSource: row.attribution_source
      ? (String(row.attribution_source) as Conversion["attributionSource"])
      : "manual",
    status: String(row.status) as Conversion["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapPayout(row: Record<string, unknown>): Payout {
  return {
    id: String(row.id),
    influencerId: String(row.influencer_id),
    amount: Number(row.amount),
    currency: String(row.currency) as Payout["currency"],
    status: String(row.status) as Payout["status"],
    method: String(row.method) as Payout["method"],
    reference: row.reference ? String(row.reference) : null,
    paidAt: row.paid_at ? String(row.paid_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapPromoAsset(row: Record<string, unknown>): PromoAsset {
  return {
    id: String(row.id),
    title: String(row.title),
    type: String(row.type) as PromoAsset["type"],
    fileUrl: String(row.file_url),
    description: String(row.description),
    caption: row.caption ? String(row.caption) : null,
    instructions: row.instructions ? String(row.instructions) : null,
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
  };
}

function mapInfluencerAssetAccess(
  row: Record<string, unknown>,
): InfluencerAssetAccess {
  return {
    id: String(row.id),
    influencerId: String(row.influencer_id),
    assetId: String(row.asset_id),
    createdAt: String(row.created_at),
  };
}

function mapPromoCode(row: Record<string, unknown>): PromoCode {
  return {
    id: String(row.id),
    influencerId: String(row.influencer_id),
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    code: String(row.code),
    discountValue: Number(row.discount_value ?? 10),
    status: String(row.status) as PromoCode["status"],
    source: String(row.source) as PromoCode["source"],
    isPrimary: Boolean(row.is_primary),
    requestMessage: row.request_message ? String(row.request_message) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    landingUrl: String(row.landing_url),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    status: String(row.status) as Campaign["status"],
    commissionType: row.commission_type
      ? (String(row.commission_type) as Campaign["commissionType"])
      : null,
    commissionValue:
      row.commission_value === undefined || row.commission_value === null
        ? null
        : Number(row.commission_value),
    bonusTitle: row.bonus_title ? String(row.bonus_title) : null,
    bonusDescription: row.bonus_description
      ? String(row.bonus_description)
      : null,
    bonusType: row.bonus_type ? (String(row.bonus_type) as Campaign["bonusType"]) : null,
    bonusValue:
      row.bonus_value === undefined || row.bonus_value === null
        ? null
        : Number(row.bonus_value),
    appliesToAll: Boolean(row.applies_to_all),
    affiliateIds: Array.isArray(row.affiliate_ids) ? row.affiliate_ids.map(String) : [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapReward(row: Record<string, unknown>): Reward {
  return {
    id: String(row.id),
    influencerId: row.influencer_id ? String(row.influencer_id) : null,
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    type: String(row.type) as Reward["type"],
    title: String(row.title),
    description: String(row.description),
    value:
      row.value === undefined || row.value === null ? null : Number(row.value),
    currency: String(row.currency) as Reward["currency"],
    status: String(row.status) as Reward["status"],
    issuedAt: row.issued_at ? String(row.issued_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapSuspiciousEvent(row: Record<string, unknown>): SuspiciousEvent {
  return {
    id: String(row.id),
    influencerId: String(row.influencer_id),
    referralLinkId: row.referral_link_id ? String(row.referral_link_id) : null,
    promoCodeId: row.promo_code_id ? String(row.promo_code_id) : null,
    conversionId: row.conversion_id ? String(row.conversion_id) : null,
    type: String(row.type) as SuspiciousEvent["type"],
    severity: String(row.severity) as SuspiciousEvent["severity"],
    status: String(row.status) as SuspiciousEvent["status"],
    title: String(row.title),
    detail: String(row.detail),
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapPayoutAllocation(row: Record<string, unknown>): PayoutAllocation {
  return {
    id: String(row.id),
    payoutId: String(row.payout_id),
    conversionId: String(row.conversion_id),
    influencerId: String(row.influencer_id),
    amount: Number(row.amount),
    releasedAt: row.released_at ? String(row.released_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapProgramSettings(row: Record<string, unknown>): ProgramSettings {
  return {
    id: String(row.id),
    defaultCommissionType: String(row.default_commission_type) as ProgramSettings["defaultCommissionType"],
    defaultCommissionValue: Number(row.default_commission_value),
    defaultCurrency: String(row.default_currency) as ProgramSettings["defaultCurrency"],
    referralBasePath: String(row.referral_base_path),
    defaultReferralDestinationPath: String(row.default_referral_destination_path),
    allowAffiliateCodeGeneration: row.allow_affiliate_code_generation === undefined ? true : Boolean(row.allow_affiliate_code_generation),
    allowPromoCodeRequests: row.allow_promo_code_requests === undefined ? true : Boolean(row.allow_promo_code_requests),
    allowCustomLinkDestinations:
      row.allow_custom_link_destinations === undefined
        ? true
        : Boolean(row.allow_custom_link_destinations),
    promoCodePrefix: row.promo_code_prefix ? String(row.promo_code_prefix) : "AFF",
    emailBrandName: row.email_brand_name ? String(row.email_brand_name) : "Affinity",
    emailReplyTo: row.email_reply_to ? String(row.email_reply_to) : "support@example.com",
    antiLeakEnabled:
      row.anti_leak_enabled === undefined ? true : Boolean(row.anti_leak_enabled),
    blockSelfReferrals:
      row.block_self_referrals === undefined ? true : Boolean(row.block_self_referrals),
    requireCodeOwnershipMatch:
      row.require_code_ownership_match === undefined
        ? true
        : Boolean(row.require_code_ownership_match),
    fraudReviewEnabled:
      row.fraud_review_enabled === undefined ? true : Boolean(row.fraud_review_enabled),
    maxClicksPerIpPerDay:
      row.max_clicks_per_ip_per_day === undefined
        ? 30
        : Number(row.max_clicks_per_ip_per_day),
    maxConversionsPerIpPerDay:
      row.max_conversions_per_ip_per_day === undefined
        ? 5
        : Number(row.max_conversions_per_ip_per_day),
    enableRewards: row.enable_rewards === undefined ? true : Boolean(row.enable_rewards),
    enableStoreCredit:
      row.enable_store_credit === undefined ? false : Boolean(row.enable_store_credit),
    enableMarketplace:
      row.enable_marketplace === undefined ? false : Boolean(row.enable_marketplace),
    enableMultiLevel:
      row.enable_multi_level === undefined ? false : Boolean(row.enable_multi_level),
    enableMultiProgram:
      row.enable_multi_program === undefined ? false : Boolean(row.enable_multi_program),
    enableAutoPayouts:
      row.enable_auto_payouts === undefined ? false : Boolean(row.enable_auto_payouts),
    allowedDestinationUrls: Array.isArray(row.allowed_destination_urls)
      ? row.allowed_destination_urls.map(String)
      : [createAbsoluteUrl("/shop")],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function createFallbackStoreConnection(
  programSettings: ProgramSettings,
): StoreConnection {
  return {
    id: "store_connection_default",
    platform: "shopify",
    storeName: `${programSettings.emailBrandName} Store`,
    shopDomain: "connect-your-store.myshopify.com",
    storefrontUrl: createAbsoluteUrl("/shop"),
    defaultDestinationUrl:
      programSettings.allowedDestinationUrls[0] ?? createAbsoluteUrl("/shop"),
    installState: "not_installed",
    status: "attention_required",
    connectionHealth: "warning",
    syncProductsEnabled: true,
    syncDiscountCodesEnabled: true,
    orderAttributionEnabled: true,
    autoCreateDiscountCodes: true,
    appEmbedEnabled: false,
    requiredScopes: [
      "read_products",
      "read_content",
      "read_discounts",
      "write_discounts",
      "read_orders",
    ],
    grantedScopes: [],
    installedAt: null,
    connectedAt: null,
    lastHealthCheckAt: null,
    lastHealthError: "L'app Shopify non e ancora installata.",
    lastProductsSyncAt: null,
    lastDiscountSyncAt: null,
    lastOrdersSyncAt: null,
    lastWebhookAt: null,
    productsSyncedCount: 0,
    collectionsSyncedCount: 0,
    discountsSyncedCount: 0,
    updatedAt: programSettings.updatedAt,
  };
}

function getCatalogTypeFromUrl(url: string): StoreCatalogItem["type"] {
  try {
    const pathname = new URL(url).pathname;

    if (pathname === "/" || pathname === "/shop") {
      return "homepage";
    }

    if (pathname.includes("/collections/")) {
      return "collection";
    }

    if (pathname.includes("/products/")) {
      return "product";
    }

    return "page";
  } catch {
    return "page";
  }
}

function getCatalogHandleFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

function getCatalogTitleFromUrl(url: string) {
  const handle = getCatalogHandleFromUrl(url);

  if (!handle) {
    return "Vetrina";
  }

  return handle
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function uniqueTrimmedValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getNotificationEmail(
  notificationEmail: string | undefined,
  payoutEmail: string,
) {
  return notificationEmail?.trim().toLowerCase() || payoutEmail.trim().toLowerCase();
}

function getPayoutProviderStatusForMethod(
  method: Influencer["payoutMethod"],
  currentStatus: Influencer["payoutProviderStatus"],
) {
  return method === "paypal" ? "ready" : currentStatus;
}

function getDestinationPathFromUrl(url: string) {
  try {
    const destination = new URL(url);
    return `${destination.pathname}${destination.search}` || "/";
  } catch {
    return null;
  }
}

function createFallbackStoreCatalogItems(
  programSettings: ProgramSettings,
  storeConnection: StoreConnection,
): StoreCatalogItem[] {
  const destinations = Array.from(
    new Set([
      storeConnection.defaultDestinationUrl,
      storeConnection.storefrontUrl,
      ...programSettings.allowedDestinationUrls,
    ]),
  );

  return destinations.map((destinationUrl, index) => ({
    id: `store_catalog_${index + 1}`,
    shopifyResourceId: null,
    title: getCatalogTitleFromUrl(destinationUrl),
    type: getCatalogTypeFromUrl(destinationUrl),
    handle: getCatalogHandleFromUrl(destinationUrl),
    destinationUrl,
    isAffiliateEnabled: programSettings.allowedDestinationUrls.includes(destinationUrl),
    isFeatured: destinationUrl === storeConnection.defaultDestinationUrl,
    createdAt: storeConnection.updatedAt,
    updatedAt: storeConnection.updatedAt,
  }));
}

async function getProgramSettings() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("program_settings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = ensureData(data, error);

  if (!row) {
    throw new Error("Le impostazioni programma mancano. Inizializza prima la tabella program_settings.");
  }

  return mapProgramSettings(row);
}

async function loadProgramGraph(): Promise<ProgramGraph> {
  const admin = createSupabaseAdminClient();
  const [
    profileRows,
    applicationRows,
    influencerRows,
    referralLinkRows,
    clickRows,
    conversionRows,
    payoutRows,
    payoutAllocationRows,
    promoAssetRows,
    assetAccessRows,
    promoCodeRows,
    campaignRows,
    rewardRows,
    suspiciousEventRows,
  ] = await Promise.all([
    admin.from("profiles").select("*"),
    admin.from("influencer_applications").select("*"),
    admin.from("influencers").select("*"),
    admin.from("referral_links").select("*"),
    admin.from("link_clicks").select("*"),
    admin.from("conversions").select("*"),
    admin.from("payouts").select("*"),
    admin.from("payout_allocations").select("*"),
    admin.from("promo_assets").select("*"),
    admin.from("influencer_asset_access").select("*"),
    admin.from("promo_codes").select("*"),
    admin.from("campaigns").select("*"),
    admin.from("rewards").select("*"),
    admin.from("suspicious_events").select("*"),
  ]);

  return {
    profiles: (ensureData(profileRows.data, profileRows.error) ?? []).map(mapProfile),
    applications: (ensureData(applicationRows.data, applicationRows.error) ?? []).map(
      mapApplication,
    ),
    influencers: (ensureData(influencerRows.data, influencerRows.error) ?? []).map(
      mapInfluencer,
    ),
    referralLinks: (ensureData(referralLinkRows.data, referralLinkRows.error) ?? []).map(
      mapReferralLink,
    ),
    clicks: (ensureData(clickRows.data, clickRows.error) ?? []).map(mapLinkClick),
    conversions: (ensureData(conversionRows.data, conversionRows.error) ?? []).map(
      mapConversion,
    ),
    payouts: (ensureData(payoutRows.data, payoutRows.error) ?? []).map(mapPayout),
    payoutAllocations: (
      ensureData(payoutAllocationRows.data, payoutAllocationRows.error) ?? []
    ).map(mapPayoutAllocation),
    promoAssets: (ensureData(promoAssetRows.data, promoAssetRows.error) ?? []).map(
      mapPromoAsset,
    ),
    influencerAssetAccess: (
      ensureData(assetAccessRows.data, assetAccessRows.error) ?? []
    ).map(mapInfluencerAssetAccess),
    promoCodes: (ensureData(promoCodeRows.data, promoCodeRows.error) ?? []).map(
      mapPromoCode,
    ),
    campaigns: (ensureData(campaignRows.data, campaignRows.error) ?? []).map(mapCampaign),
    rewards: (ensureData(rewardRows.data, rewardRows.error) ?? []).map(mapReward),
    suspiciousEvents: (
      ensureData(suspiciousEventRows.data, suspiciousEventRows.error) ?? []
    ).map(mapSuspiciousEvent),
  };
}

async function logAuditEvent(input: {
  actorProfileId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload: Record<string, string | number | boolean | null>;
  createdAt?: string;
}) {
  const admin = createSupabaseAdminClient();
  await admin.from("audit_logs").insert({
    actor_profile_id: input.actorProfileId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    payload: input.payload,
    created_at: input.createdAt ?? new Date().toISOString(),
  });
}

async function syncCampaignReward(
  campaign: Campaign,
  defaultCurrency: ProgramSettings["defaultCurrency"],
) {
  const admin = createSupabaseAdminClient();
  const existingReward = await admin
    .from("rewards")
    .select("*")
    .eq("campaign_id", campaign.id)
    .is("influencer_id", null)
    .maybeSingle();

  if (!campaign.bonusTitle || !campaign.bonusType) {
    if (existingReward.data) {
      await admin.from("rewards").delete().eq("id", existingReward.data.id);
    }
    return;
  }

  const payload = {
    influencer_id: null,
    campaign_id: campaign.id,
    type: campaign.bonusType,
    title: campaign.bonusTitle,
    description: campaign.bonusDescription ?? campaign.bonusTitle,
    value: campaign.bonusValue,
    currency: defaultCurrency,
    status:
      campaign.status === "scheduled"
        ? "available"
        : campaign.status === "active"
          ? "earned"
          : "issued",
    issued_at: campaign.status === "ended" ? new Date().toISOString() : null,
  };

  if (existingReward.data) {
    await admin.from("rewards").update(payload).eq("id", existingReward.data.id);
    return;
  }

  await admin.from("rewards").insert(payload);
}

export const supabaseRepository: Repository = {
  async getProgramSummary() {
    const admin = createSupabaseAdminClient();
    const settings = await getProgramSettings();
    const [{ data: influencers, error: influencersError }, { data: profiles, error: profilesError }] = await Promise.all([
      admin.from("influencers").select("id, is_active"),
      admin.from("profiles").select("country, role"),
    ]);

    const influencerRows = ensureData(influencers, influencersError) ?? [];
    const profileRows = ensureData(profiles, profilesError) ?? [];

    return {
      totalCreators: influencerRows.length,
      activeCreators: influencerRows.filter((row) => row.is_active).length,
      countries: new Set(
        profileRows
          .filter((row) => row.role === "INFLUENCER")
          .map((row) => row.country)
          .filter(Boolean),
      ).size,
      defaultCommissionValue: settings.defaultCommissionValue,
    };
  },

  async createApplication(input: ApplicationInput) {
    const admin = createSupabaseAdminClient();
    const email = input.email.trim().toLowerCase();
    const now = new Date().toISOString();

    const [{ data: existingProfile }, { data: existingApplication }] = await Promise.all([
      admin.from("profiles").select("id").eq("email", email).maybeSingle(),
      admin
        .from("influencer_applications")
        .select("id")
        .eq("email", email)
        .maybeSingle(),
    ]);

    if (existingProfile || existingApplication) {
      throw new Error("Questa email e gia in uso.");
    }

    const { data: authResult, error: authError } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
      },
    });

    if (authError || !authResult.user) {
      throw new Error(authError?.message ?? "Could not create the auth user.");
    }

    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .insert({
        auth_user_id: authResult.user.id,
        role: "INFLUENCER",
        full_name: input.fullName.trim(),
        email,
        country: input.country.trim(),
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    const profile = mapProfile(ensureData(profileData, profileError));

    const { data: applicationData, error: applicationError } = await admin
      .from("influencer_applications")
      .insert({
        profile_id: profile.id,
        auth_user_id: authResult.user.id,
        full_name: input.fullName.trim(),
        email,
        instagram_handle: input.instagramHandle.replace(/^@/, "").trim(),
        tiktok_handle: input.tiktokHandle?.replace(/^@/, "").trim() || null,
        youtube_handle: input.youtubeHandle?.replace(/^@/, "").trim() || null,
        primary_platform: input.primaryPlatform,
        audience_size: input.audienceSize,
        country: input.country.trim(),
        niche: input.niche.trim(),
        message: input.message.trim(),
        consent_accepted: input.consentAccepted,
        status: "pending",
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    return mapApplication(ensureData(applicationData, applicationError));
  },

  async authenticateWithPassword(input) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(input);

    if (error) {
      return null;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const profile = await this.getProfileByAuthUserId(user.id);

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
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    const row = ensureData(data, error);
    return row ? mapProfile(row) : null;
  },

  async getProfileByAuthUserId(authUserId) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    const row = ensureData(data, error);
    return row ? mapProfile(row) : null;
  },

  async getApplicationStatusForProfile(profileId) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("influencer_applications")
      .select("status, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = ensureData(data, error);
    return row ? (String(row.status) as InfluencerApplication["status"]) : null;
  },

  async getInfluencerDashboard(profileId) {
    const [graph, settings] = await Promise.all([
      loadProgramGraph(),
      getProgramSettings(),
    ]);

    return buildInfluencerDashboardData(graph, profileId, settings);
  },

  async getInfluencerSettings(profileId) {
    const admin = createSupabaseAdminClient();
    const profile = await this.getProfileById(profileId);

    if (!profile) {
      return null;
    }

    const [{ data: influencerRow, error: influencerError }, { data: applicationRow, error: applicationError }] = await Promise.all([
      admin.from("influencers").select("*").eq("profile_id", profileId).maybeSingle(),
      admin
        .from("influencer_applications")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!influencerRow) {
      return null;
    }

    return {
      profile,
      influencer: mapInfluencer(ensureData(influencerRow, influencerError)),
      application: applicationRow
        ? mapApplication(ensureData(applicationRow, applicationError))
        : null,
    } satisfies InfluencerSettingsData;
  },

  async updateInfluencerSettings(profileId, input) {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data: currentInfluencerRow, error: currentInfluencerError } = await admin
      .from("influencers")
      .select("*")
      .eq("profile_id", profileId)
      .single();
    const currentInfluencer = mapInfluencer(
      ensureData(currentInfluencerRow, currentInfluencerError),
    );
    const payoutEmail = input.payoutEmail.trim().toLowerCase();

    const { data: profileRow, error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: input.fullName.trim(),
        country: input.country.trim(),
        updated_at: now,
      })
      .eq("id", profileId)
      .select("*")
      .single();

    const { data: influencerRow, error: influencerError } = await admin
      .from("influencers")
      .update({
        payout_method: input.payoutMethod,
        payout_provider_status: getPayoutProviderStatusForMethod(
          input.payoutMethod,
          currentInfluencer.payoutProviderStatus,
        ),
        payout_email: payoutEmail,
        company_name: input.companyName?.trim() || null,
        tax_id: input.taxId?.trim() || null,
        notification_email: getNotificationEmail(input.notificationEmail, payoutEmail),
        notifications_enabled: input.notificationsEnabled,
        updated_at: now,
      })
      .eq("profile_id", profileId)
      .select("*")
      .single();

    const { data: applicationRow, error: applicationError } = await admin
      .from("influencer_applications")
      .update({
        full_name: input.fullName.trim(),
        country: input.country.trim(),
        instagram_handle: normalizeHandle(input.instagramHandle) ?? "",
        tiktok_handle: normalizeHandle(input.tiktokHandle),
        youtube_handle: normalizeHandle(input.youtubeHandle),
        updated_at: now,
      })
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .select("*")
      .maybeSingle();

    return {
      profile: mapProfile(ensureData(profileRow, profileError)),
      influencer: mapInfluencer(ensureData(influencerRow, influencerError)),
      application: applicationRow
        ? mapApplication(ensureData(applicationRow, applicationError))
        : null,
    } satisfies InfluencerSettingsData;
  },

  async getAdminOverview() {
    const [graph, settings] = await Promise.all([
      loadProgramGraph(),
      getProgramSettings(),
    ]);

    return buildAdminOverviewData(graph, settings);
  },

  async listApplications(status = "all") {
    const admin = createSupabaseAdminClient();
    let query = admin
      .from("influencer_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    const rows = ensureData(data, error) ?? [];
    const reviewerIds = rows
      .map((row) => row.reviewed_by)
      .filter(Boolean) as string[];
    const { data: reviewerRows, error: reviewerError } = reviewerIds.length
      ? await admin.from("profiles").select("id, full_name").in("id", reviewerIds)
      : { data: [], error: null };
    const reviewerMap = new Map(
      (ensureData(reviewerRows, reviewerError) ?? []).map((row) => [
        String(row.id),
        String(row.full_name),
      ]),
    );

    return rows.map((row) => {
      const application = mapApplication(row);
      return {
        ...application,
        reviewerName: application.reviewedBy
          ? reviewerMap.get(application.reviewedBy) ?? null
          : null,
      } satisfies ApplicationListItem;
    });
  },

  async approveApplication(applicationId, reviewerProfileId, input) {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const settings = await getProgramSettings();
    const { data: applicationRow, error: applicationError } = await admin
      .from("influencer_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    const application = mapApplication(ensureData(applicationRow, applicationError));
    let profile = application.profileId ? await this.getProfileById(application.profileId) : null;
    const payoutMethod = input.payoutMethod ?? "paypal";

    if (!profile) {
      const { data: profileRow, error: profileError } = await admin
        .from("profiles")
        .insert({
          auth_user_id: application.authUserId,
          role: "INFLUENCER",
          full_name: application.fullName,
          email: application.email,
          country: application.country,
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();
      profile = mapProfile(ensureData(profileRow, profileError));
    } else {
      const { data: updatedProfileRow, error: updatedProfileError } = await admin
        .from("profiles")
        .update({
          auth_user_id: application.authUserId ?? profile.authUserId,
          full_name: application.fullName,
          email: application.email,
          country: application.country,
          updated_at: now,
        })
        .eq("id", profile.id)
        .select("*")
        .single();
      profile = mapProfile(ensureData(updatedProfileRow, updatedProfileError));
    }

    const [{ data: existingInfluencerRow }, { data: influencerRows }] = await Promise.all([
      admin.from("influencers").select("*").eq("profile_id", profile.id).maybeSingle(),
      admin.from("influencers").select("public_slug, discount_code"),
    ]);

    const existingSlugs =
      influencerRows?.map((row) => String(row.public_slug)) ?? [];
    const existingCodes =
      influencerRows?.map((row) => String(row.discount_code)) ?? [];

    let influencer: Influencer;

    if (existingInfluencerRow) {
      const { data: updatedInfluencerRow, error: updatedInfluencerError } = await admin
        .from("influencers")
        .update({
          application_id: application.id,
          is_active: true,
          commission_type: input.commissionType ?? settings.defaultCommissionType,
          commission_value: input.commissionValue ?? settings.defaultCommissionValue,
          payout_method: payoutMethod,
          payout_provider_status: getPayoutProviderStatusForMethod(
            payoutMethod,
            mapInfluencer(existingInfluencerRow).payoutProviderStatus,
          ),
          payout_email: application.email,
          notification_email: application.email,
          notes: input.reviewNotes?.trim() || "",
          updated_at: now,
        })
        .eq("id", existingInfluencerRow.id)
        .select("*")
        .single();
      influencer = mapInfluencer(ensureData(updatedInfluencerRow, updatedInfluencerError));
    } else {
      const { data: influencerRow, error: influencerError } = await admin
        .from("influencers")
        .insert({
          profile_id: profile.id,
          application_id: application.id,
          public_slug: generateReferralSlug(application.fullName, existingSlugs),
          discount_code: generateDiscountCode(application.fullName, existingCodes),
          commission_type: input.commissionType ?? settings.defaultCommissionType,
          commission_value: input.commissionValue ?? settings.defaultCommissionValue,
          is_active: true,
          payout_method: payoutMethod,
          payout_provider_status:
            payoutMethod === "paypal" ? "ready" : "not_connected",
          payout_email: application.email,
          company_name: null,
          tax_id: null,
          notification_email: application.email,
          notifications_enabled: true,
          notes: input.reviewNotes?.trim() || "",
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();
      influencer = mapInfluencer(ensureData(influencerRow, influencerError));
    }

    await admin
      .from("influencer_applications")
      .update({
        profile_id: profile.id,
        status: "approved",
        reviewed_by: reviewerProfileId,
        review_notes: input.reviewNotes?.trim() || null,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", applicationId);

    const { data: existingLink } = await admin
      .from("referral_links")
      .select("id")
      .eq("influencer_id", influencer.id)
      .eq("is_primary", true)
      .maybeSingle();

    if (!existingLink) {
      await admin.from("referral_links").insert({
        influencer_id: influencer.id,
        name: "Link storefront principale",
        code: influencer.publicSlug,
        destination_url: createAbsoluteUrl(`/shop?ref=${influencer.publicSlug}`),
        is_primary: true,
        is_active: true,
        archived_at: null,
        created_at: now,
      });
    }

    const { data: existingPrimaryPromoCode, error: existingPrimaryPromoCodeError } = await admin
      .from("promo_codes")
      .select("id")
      .eq("influencer_id", influencer.id)
      .eq("is_primary", true)
      .maybeSingle();

    ensureData(existingPrimaryPromoCode, existingPrimaryPromoCodeError);

    if (!existingPrimaryPromoCode) {
      await admin.from("promo_codes").insert({
        influencer_id: influencer.id,
        campaign_id: null,
        code: influencer.discountCode,
        discount_value: 10,
        status: "active",
        source: "assigned",
        is_primary: true,
        request_message: null,
        approved_by: reviewerProfileId,
        created_at: now,
        updated_at: now,
      });
    }

    if (input.campaignId) {
      const { data: campaignRow, error: campaignError } = await admin
        .from("campaigns")
        .select("*")
        .eq("id", input.campaignId)
        .single();
      const campaign = mapCampaign(ensureData(campaignRow, campaignError));

      if (!campaign.appliesToAll && !campaign.affiliateIds.includes(influencer.id)) {
        await admin
          .from("campaigns")
          .update({
            affiliate_ids: [...campaign.affiliateIds, influencer.id],
            updated_at: now,
          })
          .eq("id", campaign.id);
      }

      if (settings.enableRewards && campaign.bonusType && campaign.bonusTitle) {
        const { data: existingReward, error: existingRewardError } = await admin
          .from("rewards")
          .select("id")
          .eq("campaign_id", campaign.id)
          .eq("influencer_id", influencer.id)
          .maybeSingle();

        ensureData(existingReward, existingRewardError);

        if (!existingReward) {
          await admin.from("rewards").insert({
            influencer_id: influencer.id,
            campaign_id: campaign.id,
            type: campaign.bonusType,
            title: campaign.bonusTitle,
            description: campaign.bonusDescription ?? campaign.bonusTitle,
            value: campaign.bonusValue ?? null,
            currency: settings.defaultCurrency,
            status: "available",
            issued_at: null,
            created_at: now,
          });
        }
      }
    }

    await logAuditEvent({
      actorProfileId: reviewerProfileId,
      entityType: "application",
      entityId: application.id,
      action: "approved",
      payload: {
        influencer_id: influencer.id,
        status: "approved",
        payoutMethod,
        campaignId: input.campaignId ?? null,
      },
      createdAt: now,
    });

    return influencer;
  },

  async rejectApplication(applicationId, reviewerProfileId, reason) {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const { error } = await admin
      .from("influencer_applications")
      .update({
        status: "rejected",
        reviewed_by: reviewerProfileId,
        reviewed_at: now,
        review_notes: reason ?? "Not a fit for the current program.",
        updated_at: now,
      })
      .eq("id", applicationId);

    ensureData(true, error);

    await admin.from("audit_logs").insert({
      actor_profile_id: reviewerProfileId,
      entity_type: "application",
      entity_id: applicationId,
      action: "rejected",
      payload: {
        status: "rejected",
      },
      created_at: now,
    });
  },

  async listInfluencers(search) {
    const graph = await loadProgramGraph();
    const query = search?.trim().toLowerCase();

    return buildInfluencerListItems(graph).filter((influencer) => {
      if (!query) {
        return true;
      }

      return [
        influencer.fullName,
        influencer.email,
        influencer.discountCode,
        influencer.publicSlug,
        influencer.country ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  },

  async updateInfluencerAdmin(influencerId, input) {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data: influencerRow, error: influencerError } = await admin
      .from("influencers")
      .select("*")
      .eq("id", influencerId)
      .single();

    const influencer = mapInfluencer(ensureData(influencerRow, influencerError));

    const { data: duplicateProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", input.email.trim().toLowerCase())
      .neq("id", influencer.profileId)
      .maybeSingle();

    if (duplicateProfile) {
      throw new Error("Questa email e gia assegnata a un altro profilo.");
    }

    await Promise.all([
      admin
        .from("profiles")
        .update({
          full_name: input.fullName.trim(),
          email: input.email.trim().toLowerCase(),
          country: input.country.trim(),
          updated_at: now,
        })
        .eq("id", influencer.profileId),
      admin
        .from("influencers")
        .update({
          is_active: input.isActive,
          commission_type: input.commissionType,
          commission_value: input.commissionValue,
          payout_method: input.payoutMethod,
          payout_provider_status: getPayoutProviderStatusForMethod(
            input.payoutMethod,
            influencer.payoutProviderStatus,
          ),
          payout_email: input.payoutEmail.trim().toLowerCase(),
          notes: input.notes?.trim() ?? "",
          updated_at: now,
        })
        .eq("id", influencerId),
      influencer.applicationId
        ? admin
            .from("influencer_applications")
            .update({
              full_name: input.fullName.trim(),
              email: input.email.trim().toLowerCase(),
              country: input.country.trim(),
              updated_at: now,
            })
            .eq("id", influencer.applicationId)
        : Promise.resolve({ error: null }),
    ]);

    const refreshed = await admin
      .from("influencers")
      .select("*")
      .eq("id", influencerId)
      .single();

    return mapInfluencer(ensureData(refreshed.data, refreshed.error));
  },

  async getAffiliateDetail(influencerId): Promise<AffiliateDetailData | null> {
    const graph = await loadProgramGraph();
    return buildAffiliateDetailData(graph, influencerId);
  },

  async listReferralLinks(search): Promise<ReferralLinkListItem[]> {
    const graph = await loadProgramGraph();
    const query = search?.trim().toLowerCase();

    return buildReferralLinkListItems(graph)
      .filter((referralLink) => {
        if (!query) {
          return true;
        }

        return [
          referralLink.name,
          referralLink.code,
          referralLink.destinationUrl,
          referralLink.influencerName,
          referralLink.campaignName ?? "",
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

  async createReferralLink(
    profileId: string,
    input: ReferralLinkInput,
  ): Promise<ReferralLink> {
    const admin = createSupabaseAdminClient();
    const [settings, graph] = await Promise.all([getProgramSettings(), loadProgramGraph()]);
    const influencer = graph.influencers.find((item) => item.profileId === profileId);

    if (!influencer) {
      throw new Error("Account affiliato non trovato.");
    }

    const destinationUrl = input.destinationUrl.trim();

    if (!isAllowedDestinationUrl(destinationUrl, settings.allowedDestinationUrls)) {
      throw new Error("Questo URL di destinazione non e consentito per il programma.");
    }

    if (input.campaignId) {
      const campaign = graph.campaigns.find((item) => item.id === input.campaignId);

      if (!campaign || !campaignAppliesToInfluencer(campaign, influencer.id)) {
      throw new Error("Questa campagna non e assegnata al tuo account affiliato.");
      }
    }

    const now = new Date().toISOString();
    const code = generateReferralSlug(
      `${influencer.publicSlug}-${input.name.trim()}`,
      graph.referralLinks.map((referralLink) => referralLink.code),
    );
    const destinationWithTracking = appendQueryParams(destinationUrl, {
      ref: influencer.publicSlug,
      utm_source: input.utmSource?.trim() || null,
      utm_medium: input.utmMedium?.trim() || null,
      utm_campaign: input.utmCampaign?.trim() || null,
    });
    const { data, error } = await admin
      .from("referral_links")
      .insert({
        influencer_id: influencer.id,
        name: input.name.trim(),
        code,
        destination_url: destinationWithTracking,
        is_primary: false,
        is_active: true,
        archived_at: null,
        campaign_id: input.campaignId ?? null,
        utm_source: input.utmSource?.trim() || null,
        utm_medium: input.utmMedium?.trim() || null,
        utm_campaign: input.utmCampaign?.trim() || null,
        created_at: now,
      })
      .select("*")
      .single();

    const referralLink = mapReferralLink(ensureData(data, error));
    await logAuditEvent({
      actorProfileId: profileId,
      entityType: "referral_link",
      entityId: referralLink.id,
      action: "created",
      payload: {
        code: referralLink.code,
      },
      createdAt: now,
    });

    return referralLink;
  },

  async updateReferralLinkStatus(
    input: ReferralLinkStatusInput,
    actorProfileId: string,
  ): Promise<ReferralLink> {
    const admin = createSupabaseAdminClient();
    const { data: existingRow, error: existingError } = await admin
      .from("referral_links")
      .select("*")
      .eq("id", input.linkId)
      .single();
    const referralLink = mapReferralLink(ensureData(existingRow, existingError));

    if (referralLink.isPrimary && !input.isActive) {
      throw new Error("I link principali non possono essere disattivati.");
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("referral_links")
      .update({
        is_active: input.isActive,
        archived_at: input.isActive ? null : now,
      })
      .eq("id", input.linkId)
      .select("*")
      .single();

    await logAuditEvent({
      actorProfileId,
      entityType: "referral_link",
      entityId: input.linkId,
      action: input.isActive ? "activated" : "deactivated",
      payload: {
        code: referralLink.code,
        isActive: input.isActive,
      },
      createdAt: now,
    });

    return mapReferralLink(ensureData(data, error));
  },

  async listPromoCodes(status = "all"): Promise<PromoCodeListItem[]> {
    const graph = await loadProgramGraph();

    return buildPromoCodeListItems(graph)
      .filter((promoCode) => (status === "all" ? true : promoCode.status === status))
      .sort((left, right) => {
        if (right.revenue !== left.revenue) {
          return right.revenue - left.revenue;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  },

  async createPromoCodeForInfluencer(
    profileId: string,
    input: PromoCodeCreateInput,
  ): Promise<PromoCode> {
    const admin = createSupabaseAdminClient();
    const [settings, graph] = await Promise.all([getProgramSettings(), loadProgramGraph()]);
    const influencer = graph.influencers.find((item) => item.profileId === profileId);

    if (!influencer) {
      throw new Error("Account affiliato non trovato.");
    }

    if (input.campaignId) {
      const campaign = graph.campaigns.find((item) => item.id === input.campaignId);

      if (!campaign || !campaignAppliesToInfluencer(campaign, influencer.id)) {
      throw new Error("Questa campagna non e assegnata al tuo account affiliato.");
      }
    }

    if (input.action === "generate" && !settings.allowAffiliateCodeGeneration) {
      throw new Error("La generazione autonoma dei codici promo non e attiva al momento.");
    }

    if (input.action === "request" && !settings.allowPromoCodeRequests) {
      throw new Error("Le richieste di codici promo sono attualmente chiuse.");
    }

    const existingCodes = graph.promoCodes.map((promoCode) => promoCode.code);
    const requestedCode = input.desiredCode?.trim() || "";
    const code = generatePromoCode(
      influencer.publicSlug,
      existingCodes,
      settings.promoCodePrefix,
      requestedCode,
    );
    const sanitizedCode = sanitizePromoCode(code);

    if (
      graph.promoCodes.some(
        (promoCode) =>
          promoCode.influencerId === influencer.id &&
          promoCode.code === sanitizedCode &&
          promoCode.status !== "rejected",
      )
    ) {
      throw new Error("Questo codice promo esiste gia nel tuo account.");
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("promo_codes")
      .insert({
        influencer_id: influencer.id,
        campaign_id: input.campaignId ?? null,
        code: sanitizedCode,
        discount_value: 10,
        status: input.action === "generate" ? "active" : "pending",
        source: input.action === "generate" ? "generated" : "requested",
        is_primary: false,
        request_message: input.requestMessage?.trim() || null,
        approved_by: input.action === "generate" ? profileId : null,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    const promoCode = mapPromoCode(ensureData(data, error));
    await logAuditEvent({
      actorProfileId: profileId,
      entityType: "promo_code",
      entityId: promoCode.id,
      action: input.action === "generate" ? "generated" : "requested",
      payload: {
        code: promoCode.code,
        status: promoCode.status,
      },
      createdAt: now,
    });

    return promoCode;
  },

  async assignPromoCode(
    input: AdminPromoCodeInput,
    actorProfileId: string,
  ): Promise<PromoCode> {
    const admin = createSupabaseAdminClient();
    const [settings, graph] = await Promise.all([getProgramSettings(), loadProgramGraph()]);
    const influencer = graph.influencers.find((item) => item.id === input.influencerId);

    if (!influencer) {
      throw new Error("Account affiliato non trovato.");
    }

    if (input.campaignId && !graph.campaigns.some((campaign) => campaign.id === input.campaignId)) {
      throw new Error("Campagna non trovata.");
    }

    const now = new Date().toISOString();
    const code = input.code?.trim()
      ? sanitizePromoCode(input.code)
      : generatePromoCode(
          influencer.publicSlug,
          graph.promoCodes.map((promoCode) => promoCode.code),
          settings.promoCodePrefix,
        );

    const duplicate = graph.promoCodes.find(
      (promoCode) => promoCode.code === code && promoCode.influencerId !== influencer.id,
    );

    if (duplicate) {
      throw new Error("Questo codice promo e gia assegnato altrove.");
    }

    if (input.isPrimary) {
      await admin
        .from("promo_codes")
        .update({ is_primary: false, updated_at: now })
        .eq("influencer_id", influencer.id)
        .eq("is_primary", true);
      await admin
        .from("influencers")
        .update({ discount_code: code, updated_at: now })
        .eq("id", influencer.id);
    }

    const { data, error } = await admin
      .from("promo_codes")
      .insert({
        influencer_id: influencer.id,
        campaign_id: input.campaignId ?? null,
        code,
        discount_value: input.discountValue,
        status: "active",
        source: "assigned",
        is_primary: input.isPrimary,
        request_message: null,
        approved_by: actorProfileId,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    const promoCode = mapPromoCode(ensureData(data, error));
    await logAuditEvent({
      actorProfileId,
      entityType: "promo_code",
      entityId: promoCode.id,
      action: "assigned",
      payload: {
        code: promoCode.code,
        isPrimary: promoCode.isPrimary,
      },
      createdAt: now,
    });

    return promoCode;
  },

  async reviewPromoCode(
    input: PromoCodeReviewInput,
    actorProfileId: string,
  ): Promise<PromoCode> {
    const admin = createSupabaseAdminClient();
    const [graph] = await Promise.all([loadProgramGraph()]);
    const existingPromoCode = graph.promoCodes.find(
      (promoCode) => promoCode.id === input.promoCodeId,
    );

    if (!existingPromoCode) {
      throw new Error("Codice promo non trovato.");
    }

    const now = new Date().toISOString();
    const finalCode = input.finalCode?.trim()
      ? sanitizePromoCode(input.finalCode)
      : existingPromoCode.code;

    if (
      input.status === "active" &&
      graph.promoCodes.some(
        (promoCode) => promoCode.id !== existingPromoCode.id && promoCode.code === finalCode,
      )
    ) {
      throw new Error("Questo codice promo esiste gia.");
    }

    const { data, error } = await admin
      .from("promo_codes")
      .update({
        code: input.status === "active" ? finalCode : existingPromoCode.code,
        status: input.status,
        approved_by: input.status === "active" ? actorProfileId : existingPromoCode.approvedBy,
        updated_at: now,
      })
      .eq("id", input.promoCodeId)
      .select("*")
      .single();

    const promoCode = mapPromoCode(ensureData(data, error));

    if (promoCode.isPrimary && input.status === "active") {
      await admin
        .from("influencers")
        .update({
          discount_code: promoCode.code,
          updated_at: now,
        })
        .eq("id", promoCode.influencerId);
    }

    await logAuditEvent({
      actorProfileId,
      entityType: "promo_code",
      entityId: promoCode.id,
      action: input.status,
      payload: {
        code: promoCode.code,
        status: promoCode.status,
      },
      createdAt: now,
    });

    return promoCode;
  },

  async listCampaigns(): Promise<CampaignListItem[]> {
    const graph = await loadProgramGraph();
    return buildCampaignListItems(graph);
  },

  async getStoreConnection(): Promise<StoreConnection> {
    try {
      const connection = await getPrimaryLiveStoreConnection();

      if (connection) {
        return connection;
      }
    } catch {
      // Fall back to the settings-based placeholder until the Shopify bridge tables exist.
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("program_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const settings = mapProgramSettings(
      ensureData(data, error) ?? {
        id: "program_settings_default",
        default_commission_type: "percentage",
        default_commission_value: 15,
        default_currency: "USD",
        referral_base_path: "/r",
        default_referral_destination_path: "/shop",
        allow_affiliate_code_generation: true,
        allow_promo_code_requests: true,
        allow_custom_link_destinations: true,
        promo_code_prefix: "AFF",
        email_brand_name: "Affinity",
        email_reply_to: "partners@example.com",
        anti_leak_enabled: true,
        block_self_referrals: true,
        require_code_ownership_match: true,
        fraud_review_enabled: true,
        max_clicks_per_ip_per_day: 6,
        max_conversions_per_ip_per_day: 2,
        enable_rewards: true,
        enable_store_credit: false,
        enable_marketplace: false,
        enable_multi_level: false,
        enable_multi_program: false,
        enable_auto_payouts: false,
        allowed_destination_urls: [createAbsoluteUrl("/shop")],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    );

    return createFallbackStoreConnection(settings);
  },

  async listStoreCatalogItems(): Promise<StoreCatalogItem[]> {
    try {
      return await listLiveStoreCatalogItems();
    } catch {
      const settings = await getProgramSettings();
      const storeConnection = createFallbackStoreConnection(settings);

      return createFallbackStoreCatalogItems(settings, storeConnection);
    }
  },

  async createCampaign(
    input: CampaignInput,
    actorProfileId: string,
  ): Promise<Campaign> {
    const admin = createSupabaseAdminClient();
    const settings = await getProgramSettings();
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error("Seleziona date campagna valide.");
    }

    if (endDate < startDate) {
      throw new Error("La data di fine campagna deve essere successiva alla data di inizio.");
    }

    const landingUrl = input.landingUrl.trim();

    if (!isAllowedDestinationUrl(landingUrl, settings.allowedDestinationUrls)) {
      throw new Error("Questo URL di landing non e consentito per il programma.");
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("campaigns")
      .insert({
        name: input.name.trim(),
        description: input.description.trim(),
        landing_url: landingUrl,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: input.status,
        commission_type: input.commissionType === "default" ? null : input.commissionType,
        commission_value:
          input.commissionType === "default" ? null : input.commissionValue ?? null,
        bonus_title: input.bonusTitle?.trim() || null,
        bonus_description: input.bonusDescription?.trim() || null,
        bonus_type: input.bonusType ?? null,
        bonus_value: input.bonusValue ?? null,
        applies_to_all: input.appliesToAll,
        affiliate_ids: input.appliesToAll ? [] : input.affiliateIds,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    const campaign = mapCampaign(ensureData(data, error));
    await syncCampaignReward(campaign, settings.defaultCurrency);
    await logAuditEvent({
      actorProfileId,
      entityType: "campaign",
      entityId: campaign.id,
      action: "created",
      payload: {
        status: campaign.status,
        appliesToAll: campaign.appliesToAll,
      },
      createdAt: now,
    });

    return campaign;
  },

  async updateCampaign(
    input: CampaignInput,
    actorProfileId: string,
  ): Promise<Campaign> {
    if (!input.id) {
      throw new Error("L'ID campagna e obbligatorio.");
    }

    const admin = createSupabaseAdminClient();
    const settings = await getProgramSettings();
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error("Seleziona date campagna valide.");
    }

    if (endDate < startDate) {
      throw new Error("La data di fine campagna deve essere successiva alla data di inizio.");
    }

    const landingUrl = input.landingUrl.trim();

    if (!isAllowedDestinationUrl(landingUrl, settings.allowedDestinationUrls)) {
      throw new Error("Questo URL di landing non e consentito per il programma.");
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("campaigns")
      .update({
        name: input.name.trim(),
        description: input.description.trim(),
        landing_url: landingUrl,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: input.status,
        commission_type: input.commissionType === "default" ? null : input.commissionType,
        commission_value:
          input.commissionType === "default" ? null : input.commissionValue ?? null,
        bonus_title: input.bonusTitle?.trim() || null,
        bonus_description: input.bonusDescription?.trim() || null,
        bonus_type: input.bonusType ?? null,
        bonus_value: input.bonusValue ?? null,
        applies_to_all: input.appliesToAll,
        affiliate_ids: input.appliesToAll ? [] : input.affiliateIds,
        updated_at: now,
      })
      .eq("id", input.id)
      .select("*")
      .single();

    const campaign = mapCampaign(ensureData(data, error));
    await syncCampaignReward(campaign, settings.defaultCurrency);
    await logAuditEvent({
      actorProfileId,
      entityType: "campaign",
      entityId: campaign.id,
      action: "updated",
      payload: {
        status: campaign.status,
        appliesToAll: campaign.appliesToAll,
        affiliateCount: campaign.appliesToAll ? 0 : campaign.affiliateIds.length,
      },
      createdAt: now,
    });

    return campaign;
  },

  async updateStoreConnection(
    input: StoreConnectionInput,
    actorProfileId: string,
  ): Promise<StoreConnection> {
    const admin = createSupabaseAdminClient();
    const [current, settings] = await Promise.all([
      getPrimaryLiveStoreConnection(),
      getProgramSettings(),
    ]);

    if (!current) {
      throw new Error("Collega prima Shopify prima di modificare le impostazioni live dello store.");
    }

    const now = new Date().toISOString();
    const defaultDestinationUrl = input.defaultDestinationUrl.trim();
    const normalizedAllowedDestinations = uniqueTrimmedValues([
      ...settings.allowedDestinationUrls,
      defaultDestinationUrl,
    ]);

    const { error } = await admin
      .from("store_connections")
      .update({
        store_name: input.storeName.trim(),
        shop_domain: input.shopDomain.trim().toLowerCase(),
        storefront_url: input.storefrontUrl.trim(),
        default_destination_url: defaultDestinationUrl,
        install_state: input.installState,
        status: input.status,
        sync_products_enabled: input.syncProductsEnabled,
        sync_discount_codes_enabled: input.syncDiscountCodesEnabled,
        order_attribution_enabled: input.orderAttributionEnabled,
        auto_create_discount_codes: input.autoCreateDiscountCodes,
        app_embed_enabled: input.appEmbedEnabled,
        granted_scopes: uniqueTrimmedValues(input.grantedScopes),
        installed_at:
          input.installState === "installed"
            ? current.installedAt ?? now
            : input.installState === "not_installed"
              ? null
              : current.installedAt,
        connected_at:
          input.status === "connected"
            ? current.connectedAt ?? now
            : input.status === "not_connected"
              ? null
              : current.connectedAt,
        updated_at: now,
      })
      .eq("id", current.id);

    if (error) {
      throw new Error(error.message);
    }

    const destinationPath = getDestinationPathFromUrl(defaultDestinationUrl);
    const { error: settingsError } = await admin
      .from("program_settings")
      .update({
        allowed_destination_urls: normalizedAllowedDestinations,
        default_referral_destination_path:
          destinationPath ?? settings.defaultReferralDestinationPath,
        updated_at: now,
      })
      .eq("id", settings.id);

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    const refreshed = await getPrimaryLiveStoreConnection();

    if (!refreshed) {
      throw new Error("Impossibile ricaricare la connessione live dello store.");
    }

    await logAuditEvent({
      actorProfileId,
      entityType: "store_connection",
      entityId: refreshed.id,
      action: "updated",
      payload: {
        shopDomain: refreshed.shopDomain,
        status: refreshed.status,
        installState: refreshed.installState,
      },
      createdAt: now,
    });

    return refreshed;
  },

  async updateStoreCatalogRules(
    input: StoreCatalogRulesInput,
    actorProfileId: string,
  ): Promise<StoreConnection> {
    const admin = createSupabaseAdminClient();
    const [current, settings] = await Promise.all([
      getPrimaryLiveStoreConnection(),
      getProgramSettings(),
    ]);

    if (!current) {
      throw new Error("Collega prima Shopify prima di aggiornare le regole delle destinazioni.");
    }

    const { data: catalogRows, error: catalogError } = await admin
      .from("store_catalog_items")
      .select("destination_url")
      .eq("connection_id", current.id);

    const enabledDestinationUrls = uniqueTrimmedValues(input.enabledDestinationUrls);

    if (!enabledDestinationUrls.length) {
      throw new Error("Abilita almeno una destinazione per gli affiliati.");
    }

    const catalogDestinations = new Set(
      (ensureData(catalogRows, catalogError) ?? []).map((item) => String(item.destination_url)),
    );
    const unknownDestination = enabledDestinationUrls.find(
      (destinationUrl) => !catalogDestinations.has(destinationUrl),
    );

    if (unknownDestination) {
      throw new Error("Una delle destinazioni selezionate non fa parte del catalogo Shopify.");
    }

    const defaultDestinationUrl = input.defaultDestinationUrl.trim();

    if (!enabledDestinationUrls.includes(defaultDestinationUrl)) {
      throw new Error("La destinazione predefinita deve essere abilitata anche per gli affiliati.");
    }

    const now = new Date().toISOString();

    const { error: disableError } = await admin
      .from("store_catalog_items")
      .update({ is_affiliate_enabled: false, updated_at: now })
      .eq("connection_id", current.id);

    if (disableError) {
      throw new Error(disableError.message);
    }

    if (enabledDestinationUrls.length) {
      const { error: enableError } = await admin
        .from("store_catalog_items")
        .update({ is_affiliate_enabled: true, updated_at: now })
        .eq("connection_id", current.id)
        .in("destination_url", enabledDestinationUrls);

      if (enableError) {
        throw new Error(enableError.message);
      }
    }

    const { error } = await admin
      .from("store_connections")
      .update({
        default_destination_url: defaultDestinationUrl,
        updated_at: now,
      })
      .eq("id", current.id);

    if (error) {
      throw new Error(error.message);
    }

    const { error: settingsError } = await admin
      .from("program_settings")
      .update({
        allowed_destination_urls: enabledDestinationUrls,
        default_referral_destination_path:
          getDestinationPathFromUrl(defaultDestinationUrl) ??
          settings.defaultReferralDestinationPath,
        updated_at: now,
      })
      .eq("id", settings.id);

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    const refreshed = await getPrimaryLiveStoreConnection();

    if (!refreshed) {
      throw new Error("Impossibile ricaricare la connessione live dello store.");
    }

    await logAuditEvent({
      actorProfileId,
      entityType: "store_catalog",
      entityId: refreshed.id,
      action: "updated",
      payload: {
        enabledDestinations: enabledDestinationUrls.length,
        defaultDestinationUrl,
      },
      createdAt: now,
    });

    return refreshed;
  },

  async listStoreSyncJobs(): Promise<StoreSyncJob[]> {
    try {
      return await listLiveStoreSyncJobs();
    } catch {
      return [];
    }
  },

  async triggerStoreSync(
    input: StoreSyncJobInput,
    actorProfileId: string,
  ): Promise<StoreSyncJob> {
    return runLiveStoreSync(input, actorProfileId);
  },

  async retryStoreSyncJob(
    jobId: string,
    actorProfileId: string,
  ): Promise<StoreSyncJob> {
    return retryLiveStoreSync(jobId, actorProfileId);
  },

  async listWebhookIngestionRecords(
    status: WebhookProcessingStatus | "all" = "all",
  ): Promise<WebhookIngestionRecord[]> {
    try {
      return await listLiveWebhookIngestionRecords(status);
    } catch {
      return [];
    }
  },

  async ingestStoreWebhook(
    input: StoreWebhookIngestionInput,
    _actorProfileId: string,
  ): Promise<WebhookIngestionRecord> {
    void _actorProfileId;
    const connection = await getPrimaryLiveStoreConnection();

    if (!connection) {
      throw new Error("Collega prima Shopify prima di acquisire eventi live dello store.");
    }

    return persistIncomingWebhook({
      topic: input.topic,
      shopDomain: connection.shopDomain,
      webhookId: null,
      rawBody: JSON.stringify({
        name: input.orderId,
        id: input.orderId,
        current_total_price: input.orderAmount ?? null,
        currency: input.currency,
        email: input.customerEmail ?? null,
        note_attributes: input.referralCode
          ? [{ name: "ref", value: input.referralCode }]
          : [],
        discount_codes: input.discountCode ? [{ code: input.discountCode }] : [],
      }),
      hmacValid: true,
    });
  },

  async retryWebhookIngestion(
    recordId: string,
    actorProfileId: string,
  ): Promise<WebhookIngestionRecord> {
    return retryLiveWebhookRecord(recordId, actorProfileId);
  },

  async updateProgramSettings(
    input: ProgramSettingsInput,
    actorProfileId: string,
  ): Promise<ProgramSettings> {
    const admin = createSupabaseAdminClient();
    const settings = await getProgramSettings();
    const now = new Date().toISOString();
    const normalizedDestinations = Array.from(
      new Set(input.allowedDestinationUrls.map((value) => value.trim()).filter(Boolean)),
    );
    const { data, error } = await admin
      .from("program_settings")
      .update({
        allow_affiliate_code_generation: input.allowAffiliateCodeGeneration,
        allow_promo_code_requests: input.allowPromoCodeRequests,
        allow_custom_link_destinations: input.allowCustomLinkDestinations,
        promo_code_prefix: sanitizePromoCode(input.promoCodePrefix),
        email_brand_name: input.emailBrandName.trim(),
        email_reply_to: input.emailReplyTo.trim().toLowerCase(),
        anti_leak_enabled: input.antiLeakEnabled,
        block_self_referrals: input.blockSelfReferrals,
        require_code_ownership_match: input.requireCodeOwnershipMatch,
        fraud_review_enabled: input.fraudReviewEnabled,
        max_clicks_per_ip_per_day: input.maxClicksPerIpPerDay,
        max_conversions_per_ip_per_day: input.maxConversionsPerIpPerDay,
        enable_rewards: input.enableRewards,
        enable_store_credit: input.enableStoreCredit,
        enable_marketplace: input.enableMarketplace,
        enable_multi_level: input.enableMultiLevel,
        enable_multi_program: input.enableMultiProgram,
        enable_auto_payouts: input.enableAutoPayouts,
        allowed_destination_urls: normalizedDestinations,
        updated_at: now,
      })
      .eq("id", settings.id)
      .select("*")
      .single();

    const programSettings = mapProgramSettings(ensureData(data, error));
    await logAuditEvent({
      actorProfileId,
      entityType: "program_settings",
      entityId: programSettings.id,
      action: "updated",
      payload: {
        allowAffiliateCodeGeneration: input.allowAffiliateCodeGeneration,
        allowPromoCodeRequests: input.allowPromoCodeRequests,
        antiLeakEnabled: input.antiLeakEnabled,
      },
      createdAt: now,
    });

    return programSettings;
  },

  async listConversions() {
    const graph = await loadProgramGraph();
    return buildConversionListItems(graph);
  },

  async createConversion(input, actorProfileId) {
    const admin = createSupabaseAdminClient();
    const settings = await getProgramSettings();
    const now = input.createdAt ?? new Date().toISOString();
    const promoCode = input.promoCodeId
      ? await admin
          .from("promo_codes")
          .select("*")
          .eq("id", input.promoCodeId)
          .maybeSingle()
          .then(({ data, error }) => (data ? mapPromoCode(ensureData(data, error)) : null))
      : null;
    const influencer = await admin
      .from("influencers")
      .select("*")
      .eq("id", input.influencerId)
      .single()
      .then(({ data, error }) => mapInfluencer(ensureData(data, error)));
    const profile = await admin
      .from("profiles")
      .select("*")
      .eq("id", influencer.profileId)
      .single()
      .then(({ data, error }) => mapProfile(ensureData(data, error)));
    const primaryReferralLinkId =
      input.referralLinkId ??
      (await admin
        .from("referral_links")
        .select("*")
        .eq("influencer_id", influencer.id)
        .eq("is_primary", true)
        .maybeSingle()
        .then(({ data, error }) => {
          const row = ensureData(data, error);
          return row ? mapReferralLink(row).id : null;
        }));

    if (
      promoCode &&
      settings.antiLeakEnabled &&
      settings.requireCodeOwnershipMatch &&
      promoCode.influencerId !== influencer.id
    ) {
      throw new Error("Il codice promo selezionato appartiene a un affiliato diverso.");
    }

    const attributionSource =
      input.attributionSource ??
      (primaryReferralLinkId && promoCode?.id
        ? "hybrid"
        : promoCode?.id
          ? "promo_code"
          : primaryReferralLinkId
            ? "link"
            : "manual");
    const commissionAmount = calculateCommission(
      input.orderAmount,
      input.commissionType,
      input.commissionValue,
    );

    const { data, error } = await admin
      .from("conversions")
      .insert({
        influencer_id: input.influencerId,
        referral_link_id: primaryReferralLinkId ?? null,
        promo_code_id: input.promoCodeId ?? null,
        order_id: input.orderId.trim(),
        customer_email: input.customerEmail?.trim() || null,
        order_amount: input.orderAmount,
        currency: input.currency,
        commission_type: input.commissionType,
        commission_value: input.commissionValue,
        commission_amount: commissionAmount,
        attribution_source: attributionSource,
        status: input.status,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    const conversion = mapConversion(ensureData(data, error));

    await admin.from("audit_logs").insert({
      actor_profile_id: actorProfileId,
      entity_type: "conversion",
      entity_id: conversion.id,
      action: "created",
      payload: {
        order_id: conversion.orderId,
        status: conversion.status,
      },
      created_at: now,
    });

    if (
      settings.fraudReviewEnabled &&
      settings.blockSelfReferrals &&
      conversion.customerEmail?.toLowerCase() === profile.email.toLowerCase()
    ) {
      await admin.from("suspicious_events").insert({
        influencer_id: influencer.id,
        referral_link_id: primaryReferralLinkId ?? null,
        promo_code_id: promoCode?.id ?? null,
        conversion_id: conversion.id,
        type: "self_referral",
        severity: "high",
        status: "open",
        title: "Possible self-referral order",
        detail: "Customer email matches the affiliate account email on a commissionable order.",
        created_at: now,
      });
    }

    return conversion;
  },

  async listPayouts() {
    const graph = await loadProgramGraph();
    return buildPayoutListItems(graph);
  },

  async getPayoutDetail(payoutId: string): Promise<PayoutDetailData | null> {
    const graph = await loadProgramGraph();
    return buildPayoutDetailData(graph, payoutId);
  },

  async createPayoutBatch(
    input: PayoutBatchInput,
    actorProfileId: string,
  ): Promise<Payout> {
    const admin = createSupabaseAdminClient();
    const [graph, settings] = await Promise.all([loadProgramGraph(), getProgramSettings()]);
    const influencer = graph.influencers.find((item) => item.id === input.influencerId);

    if (!influencer) {
      throw new Error("Account affiliato non trovato.");
    }

    const selectedConversions = input.conversionIds.map((conversionId) => {
      const conversion = graph.conversions.find((candidate) => candidate.id === conversionId);

      if (!conversion) {
      throw new Error("Una delle conversioni selezionate non esiste piu.");
      }

      return conversion;
    });

    if (!selectedConversions.length) {
      throw new Error("Seleziona almeno una conversione approvata.");
    }

    const activeAllocatedConversionIds = new Set(
      graph.payoutAllocations
        .filter((allocation) => allocation.releasedAt === null)
        .map((allocation) => allocation.conversionId),
    );
    const invalidConversion = selectedConversions.find(
      (conversion) =>
        conversion.influencerId !== influencer.id ||
        conversion.status !== "approved" ||
        activeAllocatedConversionIds.has(conversion.id),
    );

    if (invalidConversion) {
      throw new Error(
        "Only approved conversions without an active payout allocation can be batched.",
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("payouts")
      .insert({
        influencer_id: influencer.id,
        amount: Number(
          selectedConversions
            .reduce((sum, conversion) => sum + conversion.commissionAmount, 0)
            .toFixed(2),
        ),
        currency: selectedConversions[0]?.currency ?? settings.defaultCurrency,
        status: input.status,
        method: input.method,
        reference: input.reference?.trim() || null,
        paid_at: input.status === "paid" ? now : null,
        created_at: now,
      })
      .select("*")
      .single();

    const payout = mapPayout(ensureData(data, error));

    if (selectedConversions.length) {
      await admin.from("payout_allocations").insert(
        selectedConversions.map((conversion) => ({
          payout_id: payout.id,
          conversion_id: conversion.id,
          influencer_id: influencer.id,
          amount: conversion.commissionAmount,
          released_at: null,
          created_at: now,
        })),
      );
    }

    if (input.status === "paid") {
      await admin
        .from("conversions")
        .update({ status: "paid", updated_at: now })
        .in(
          "id",
          selectedConversions.map((conversion) => conversion.id),
        );
    }

    await logAuditEvent({
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

    return payout;
  },

  async updatePayout(input) {
    const admin = createSupabaseAdminClient();
    const { data: currentRow, error: currentError } = await admin
      .from("payouts")
      .select("*")
      .eq("id", input.payoutId)
      .single();

    const currentPayout = mapPayout(ensureData(currentRow, currentError));

    if (currentPayout.status === "paid" && input.status !== "paid") {
      throw new Error("I record payout pagati non possono tornare a uno stato non pagato.");
    }

    if (currentPayout.status === "failed" && input.status !== "failed") {
      throw new Error("I batch payout falliti devono essere ricreati come nuovi record payout.");
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("payouts")
      .update({
        status: input.status,
        reference: input.reference?.trim() || currentPayout.reference,
        paid_at:
          input.status === "paid" ? currentPayout.paidAt ?? now : currentPayout.paidAt,
      })
      .eq("id", input.payoutId)
      .select("*")
      .single();

    const payout = mapPayout(ensureData(data, error));
    const { data: allocationRows, error: allocationError } = await admin
      .from("payout_allocations")
      .select("*")
      .eq("payout_id", payout.id)
      .is("released_at", null);
    const allocations = (ensureData(allocationRows, allocationError) ?? []).map(
      mapPayoutAllocation,
    );
    const allocationConversionIds = allocations.map((allocation) => allocation.conversionId);

    if (input.status === "paid" && allocationConversionIds.length) {
      const { error: conversionError } = await admin
        .from("conversions")
        .update({ status: "paid", updated_at: now })
        .in("id", allocationConversionIds);

      if (conversionError) {
        throw new Error(conversionError.message);
      }
    }

    if (input.status === "failed" && allocationConversionIds.length) {
      const { error: releaseError } = await admin
        .from("payout_allocations")
        .update({ released_at: now })
        .eq("payout_id", payout.id)
        .is("released_at", null);

      if (releaseError) {
        throw new Error(releaseError.message);
      }

      const { error: conversionError } = await admin
        .from("conversions")
        .update({ status: "approved", updated_at: now })
        .in("id", allocationConversionIds)
        .neq("status", "paid");

      if (conversionError) {
        throw new Error(conversionError.message);
      }
    }

    await logAuditEvent({
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

    return payout;
  },

  async listPromoAssets() {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("promo_assets")
      .select("*")
      .order("created_at", { ascending: false });

    return ensureData(data, error)?.map(mapPromoAsset) ?? [];
  },

  async upsertPromoAsset(input, actorProfileId) {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const payload = {
      title: input.title.trim(),
      type: input.type,
      file_url: input.fileUrl.trim(),
      description: input.description.trim(),
      caption: input.caption?.trim() || null,
      instructions: input.instructions?.trim() || null,
      campaign_id: input.campaignId ?? null,
      is_active: input.isActive,
    };

    const query = input.id
      ? admin.from("promo_assets").update(payload).eq("id", input.id)
      : admin.from("promo_assets").insert(payload);

    const { data, error } = await query.select("*").single();
    const asset = mapPromoAsset(ensureData(data, error));

    await admin.from("audit_logs").insert({
      actor_profile_id: actorProfileId,
      entity_type: "promo_asset",
      entity_id: asset.id,
      action: input.id ? "updated" : "created",
      payload: {
        title: asset.title,
      },
      created_at: now,
    });

    return asset;
  },

  async trackReferralClick(input: ClickTrackingInput) {
    const admin = createSupabaseAdminClient();
    const { data: referralLinkRow, error: referralLinkError } = await admin
      .from("referral_links")
      .select("*")
      .eq("code", input.slug)
      .maybeSingle();

    const row = ensureData(referralLinkRow, referralLinkError);

    if (!row) {
      return null;
    }

    const link = mapReferralLink(row);

    if (!link.isActive && !link.isPrimary) {
      return null;
    }

    const createdAt = new Date().toISOString();

    await admin.from("link_clicks").insert({
      influencer_id: link.influencerId,
      referral_link_id: link.id,
      visitor_id: crypto.randomUUID(),
      referrer: input.referrer,
      user_agent: input.userAgent,
      ip_hash: input.ipHash,
      utm_source: input.utmSource,
      utm_medium: input.utmMedium,
      utm_campaign: input.utmCampaign,
      created_at: createdAt,
    });

    if (input.ipHash) {
      const settings = await getProgramSettings();

      if (settings.fraudReviewEnabled) {
        const startOfDay = `${createdAt.slice(0, 10)}T00:00:00.000Z`;
        const endOfDay = `${createdAt.slice(0, 10)}T23:59:59.999Z`;
        const [{ count }, { data: existingRepeatedIpFlag, error: suspiciousError }] =
          await Promise.all([
            admin
              .from("link_clicks")
              .select("id", { count: "exact", head: true })
              .eq("influencer_id", link.influencerId)
              .eq("ip_hash", input.ipHash)
              .gte("created_at", startOfDay)
              .lte("created_at", endOfDay),
            admin
              .from("suspicious_events")
              .select("id")
              .eq("influencer_id", link.influencerId)
              .eq("referral_link_id", link.id)
              .eq("type", "repeated_ip")
              .eq("status", "open")
              .maybeSingle(),
          ]);

        ensureData(existingRepeatedIpFlag, suspiciousError);

        if (
          (count ?? 0) > settings.maxClicksPerIpPerDay &&
          !existingRepeatedIpFlag
        ) {
          await admin.from("suspicious_events").insert({
            influencer_id: link.influencerId,
            referral_link_id: link.id,
            promo_code_id: null,
            conversion_id: null,
            type: "repeated_ip",
            severity: "medium",
            status: "open",
            title: "Repeated IP activity threshold reached",
            detail:
              "A single IP generated more clicks than the current daily threshold allows.",
            reviewed_by: null,
            reviewed_at: null,
            created_at: createdAt,
          });
        }
      }
    }

    return link.destinationUrl;
  },

  async archiveReferralLink(_profileId, _linkId) {
    const admin = createSupabaseAdminClient();
    const [graph] = await Promise.all([loadProgramGraph()]);
    const influencer = graph.influencers.find((item) => item.profileId === _profileId);

    if (!influencer) {
      throw new Error("Account affiliato non trovato.");
    }

    const referralLink = graph.referralLinks.find((item) => item.id === _linkId);

    if (!referralLink) {
      throw new Error("Referral link non trovato.");
    }

    if (referralLink.influencerId !== influencer.id) {
      throw new Error("Puoi archiviare solo i tuoi referral link.");
    }

    if (referralLink.isPrimary) {
      throw new Error("I link principali non possono essere archiviati.");
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("referral_links")
      .update({
        is_active: false,
        archived_at: now,
      })
      .eq("id", referralLink.id)
      .select("*")
      .single();

    await logAuditEvent({
      actorProfileId: _profileId,
      entityType: "referral_link",
      entityId: referralLink.id,
      action: "archived",
      payload: {
        code: referralLink.code,
      },
      createdAt: now,
    });

    return mapReferralLink(ensureData(data, error));
  },

  async listSuspiciousEvents(status = "all", influencerId) {
    const graph = await loadProgramGraph();

    return buildSuspiciousEventListItems(graph).filter((event) => {
      const matchesStatus = status === "all" ? true : event.status === status;
      const matchesInfluencer = influencerId ? event.influencerId === influencerId : true;

      return matchesStatus && matchesInfluencer;
    });
  },

  async reviewSuspiciousEvent(input, actorProfileId) {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("suspicious_events")
      .update({
        status: input.status,
        reviewed_by: actorProfileId,
        reviewed_at: now,
      })
      .eq("id", input.suspiciousEventId)
      .select("*")
      .single();

    const suspiciousEvent = mapSuspiciousEvent(ensureData(data, error));
    await logAuditEvent({
      actorProfileId,
      entityType: "suspicious_event",
      entityId: suspiciousEvent.id,
      action: input.status,
      payload: {
        type: suspiciousEvent.type,
        status: suspiciousEvent.status,
      },
      createdAt: now,
    });

    return suspiciousEvent;
  },

  async createManualSuspiciousEvent(input, actorProfileId) {
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("suspicious_events")
      .insert({
        influencer_id: input.influencerId,
        referral_link_id: null,
        promo_code_id: null,
        conversion_id: null,
        type: "manual_review",
        severity: input.severity,
        status: "open",
        title: input.title.trim(),
        detail: input.detail.trim(),
        reviewed_by: null,
        reviewed_at: null,
        created_at: now,
      })
      .select("*")
      .single();

    const suspiciousEvent = mapSuspiciousEvent(ensureData(data, error));
    await logAuditEvent({
      actorProfileId,
      entityType: "suspicious_event",
      entityId: suspiciousEvent.id,
      action: "created",
      payload: {
        severity: suspiciousEvent.severity,
        type: suspiciousEvent.type,
      },
      createdAt: now,
    });

    return suspiciousEvent;
  },
};

export const roles = ["ADMIN", "INFLUENCER", "MANAGER"] as const;
export type Role = (typeof roles)[number];

export const applicationStatuses = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export const primaryPlatforms = [
  "instagram",
  "tiktok",
  "youtube",
  "multi-platform",
] as const;
export type PrimaryPlatform = (typeof primaryPlatforms)[number];

export const audienceSizes = [
  "0-1k",
  "1k-5k",
  "5k-10k",
  "10k-25k",
  "25k-100k",
  "100k+",
] as const;
export type AudienceSize = (typeof audienceSizes)[number];

export const commissionTypes = ["percentage", "fixed"] as const;
export type CommissionType = (typeof commissionTypes)[number];

export const conversionStatuses = [
  "pending",
  "approved",
  "paid",
  "cancelled",
] as const;
export type ConversionStatus = (typeof conversionStatuses)[number];

export const payoutStatuses = [
  "draft",
  "pending",
  "processing",
  "paid",
  "failed",
] as const;
export type PayoutStatus = (typeof payoutStatuses)[number];

export const payoutMethods = [
  "paypal",
  "bank_transfer",
  "stripe",
  "manual",
] as const;
export type PayoutMethod = (typeof payoutMethods)[number];

export const payoutProviderStatuses = [
  "not_connected",
  "ready",
  "restricted",
] as const;
export type PayoutProviderStatus = (typeof payoutProviderStatuses)[number];

export const promoAssetTypes = ["image", "video", "copy", "brand_guide"] as const;
export type PromoAssetType = (typeof promoAssetTypes)[number];

export const promoCodeStatuses = [
  "active",
  "pending",
  "rejected",
  "disabled",
] as const;
export type PromoCodeStatus = (typeof promoCodeStatuses)[number];

export const promoCodeSources = ["assigned", "generated", "requested"] as const;
export type PromoCodeSource = (typeof promoCodeSources)[number];

export const campaignStatuses = [
  "draft",
  "scheduled",
  "active",
  "ended",
] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];

export const rewardTypes = [
  "cash_bonus",
  "gift",
  "store_credit",
  "commission_boost",
] as const;
export type RewardType = (typeof rewardTypes)[number];

export const rewardStatuses = [
  "available",
  "earned",
  "issued",
  "cancelled",
] as const;
export type RewardStatus = (typeof rewardStatuses)[number];

export const suspiciousEventTypes = [
  "self_referral",
  "repeated_ip",
  "coupon_mismatch",
  "conversion_spike",
  "manual_review",
] as const;
export type SuspiciousEventType = (typeof suspiciousEventTypes)[number];

export const suspiciousEventSeverities = ["low", "medium", "high"] as const;
export type SuspiciousEventSeverity = (typeof suspiciousEventSeverities)[number];

export const suspiciousEventStatuses = [
  "open",
  "reviewed",
  "dismissed",
] as const;
export type SuspiciousEventStatus = (typeof suspiciousEventStatuses)[number];

export const attributionSources = [
  "link",
  "promo_code",
  "hybrid",
  "manual",
] as const;
export type AttributionSource = (typeof attributionSources)[number];

export const storePlatforms = ["shopify"] as const;
export type StorePlatform = (typeof storePlatforms)[number];

export const storeConnectionStatuses = [
  "not_connected",
  "attention_required",
  "connected",
] as const;
export type StoreConnectionStatus = (typeof storeConnectionStatuses)[number];

export const shopifyInstallStates = [
  "not_installed",
  "installing",
  "installed",
  "reauth_required",
] as const;
export type ShopifyInstallState = (typeof shopifyInstallStates)[number];

export const connectionHealthStatuses = [
  "healthy",
  "warning",
  "degraded",
  "error",
] as const;
export type ConnectionHealthStatus = (typeof connectionHealthStatuses)[number];

export const storeCatalogTypes = [
  "homepage",
  "collection",
  "product",
  "page",
] as const;
export type StoreCatalogType = (typeof storeCatalogTypes)[number];

export const storeSyncJobTypes = [
  "products",
  "collections",
  "pages",
  "discounts",
  "orders",
  "attribution",
] as const;
export type StoreSyncJobType = (typeof storeSyncJobTypes)[number];

export const storeSyncJobModes = ["incremental", "full", "retry"] as const;
export type StoreSyncJobMode = (typeof storeSyncJobModes)[number];

export const storeSyncJobStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "partial",
] as const;
export type StoreSyncJobStatus = (typeof storeSyncJobStatuses)[number];

export const storeSyncSources = ["shopify", "internal", "hybrid"] as const;
export type StoreSyncSource = (typeof storeSyncSources)[number];

export const webhookTopics = [
  "orders/create",
  "orders/paid",
  "discounts/update",
  "app/uninstalled",
] as const;
export type WebhookTopic = (typeof webhookTopics)[number];

export const webhookProcessingStatuses = [
  "received",
  "processing",
  "processed",
  "failed",
  "ignored",
] as const;
export type WebhookProcessingStatus = (typeof webhookProcessingStatuses)[number];

export type CurrencyCode = "USD" | "EUR" | "GBP";

export interface Profile {
  id: string;
  authUserId: string | null;
  role: Role;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InfluencerApplication {
  id: string;
  profileId: string | null;
  authUserId: string | null;
  fullName: string;
  email: string;
  instagramHandle: string;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  primaryPlatform: PrimaryPlatform;
  audienceSize: AudienceSize;
  country: string;
  niche: string;
  message: string;
  consentAccepted: boolean;
  status: ApplicationStatus;
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Influencer {
  id: string;
  profileId: string;
  applicationId: string | null;
  publicSlug: string;
  discountCode: string;
  commissionType: CommissionType;
  commissionValue: number;
  isActive: boolean;
  payoutMethod: PayoutMethod | null;
  payoutProviderStatus: PayoutProviderStatus;
  payoutEmail: string | null;
  companyName: string | null;
  taxId: string | null;
  notificationEmail: string | null;
  notificationsEnabled: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralLink {
  id: string;
  influencerId: string;
  name: string;
  code: string;
  destinationUrl: string;
  isPrimary: boolean;
  isActive: boolean;
  archivedAt: string | null;
  campaignId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

export interface LinkClick {
  id: string;
  influencerId: string;
  referralLinkId: string | null;
  visitorId: string;
  referrer: string | null;
  userAgent: string | null;
  ipHash: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

export interface Conversion {
  id: string;
  influencerId: string;
  referralLinkId: string | null;
  promoCodeId: string | null;
  orderId: string;
  customerEmail: string | null;
  orderAmount: number;
  currency: CurrencyCode;
  commissionType: CommissionType;
  commissionValue: number;
  commissionAmount: number;
  attributionSource: AttributionSource;
  status: ConversionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  influencerId: string;
  amount: number;
  currency: CurrencyCode;
  status: PayoutStatus;
  method: PayoutMethod;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PayoutAllocation {
  id: string;
  payoutId: string;
  conversionId: string;
  influencerId: string;
  amount: number;
  releasedAt: string | null;
  createdAt: string;
}

export interface PromoAsset {
  id: string;
  title: string;
  type: PromoAssetType;
  fileUrl: string;
  description: string;
  caption: string | null;
  instructions: string | null;
  campaignId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface InfluencerAssetAccess {
  id: string;
  influencerId: string;
  assetId: string;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  influencerId: string;
  campaignId: string | null;
  code: string;
  discountValue: number;
  status: PromoCodeStatus;
  source: PromoCodeSource;
  isPrimary: boolean;
  requestMessage: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  landingUrl: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  commissionType: CommissionType | null;
  commissionValue: number | null;
  bonusTitle: string | null;
  bonusDescription: string | null;
  bonusType: RewardType | null;
  bonusValue: number | null;
  appliesToAll: boolean;
  affiliateIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgramSettings {
  id: string;
  defaultCommissionType: CommissionType;
  defaultCommissionValue: number;
  defaultCurrency: CurrencyCode;
  referralBasePath: string;
  defaultReferralDestinationPath: string;
  allowAffiliateCodeGeneration: boolean;
  allowPromoCodeRequests: boolean;
  allowCustomLinkDestinations: boolean;
  promoCodePrefix: string;
  emailBrandName: string;
  emailReplyTo: string;
  antiLeakEnabled: boolean;
  blockSelfReferrals: boolean;
  requireCodeOwnershipMatch: boolean;
  fraudReviewEnabled: boolean;
  maxClicksPerIpPerDay: number;
  maxConversionsPerIpPerDay: number;
  enableRewards: boolean;
  enableStoreCredit: boolean;
  enableMarketplace: boolean;
  enableMultiLevel: boolean;
  enableMultiProgram: boolean;
  enableAutoPayouts: boolean;
  allowedDestinationUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreConnection {
  id: string;
  platform: StorePlatform;
  storeName: string;
  shopDomain: string;
  storefrontUrl: string;
  defaultDestinationUrl: string;
  installState: ShopifyInstallState;
  status: StoreConnectionStatus;
  connectionHealth: ConnectionHealthStatus;
  syncProductsEnabled: boolean;
  syncDiscountCodesEnabled: boolean;
  orderAttributionEnabled: boolean;
  autoCreateDiscountCodes: boolean;
  appEmbedEnabled: boolean;
  requiredScopes: string[];
  grantedScopes: string[];
  installedAt: string | null;
  connectedAt: string | null;
  lastHealthCheckAt: string | null;
  lastHealthError: string | null;
  lastProductsSyncAt: string | null;
  lastDiscountSyncAt: string | null;
  lastOrdersSyncAt: string | null;
  lastWebhookAt: string | null;
  productsSyncedCount: number;
  collectionsSyncedCount: number;
  discountsSyncedCount: number;
  updatedAt: string;
}

export interface StoreCatalogItem {
  id: string;
  shopifyResourceId: string | null;
  title: string;
  type: StoreCatalogType;
  handle: string | null;
  destinationUrl: string;
  isAffiliateEnabled: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSyncJob {
  id: string;
  connectionId: string;
  type: StoreSyncJobType;
  mode: StoreSyncJobMode;
  status: StoreSyncJobStatus;
  sourceOfTruth: StoreSyncSource;
  triggeredBy: "merchant" | "system" | "webhook" | "retry";
  requestedBy: string | null;
  parentJobId: string | null;
  notes: string | null;
  errorMessage: string | null;
  cursor: string | null;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookIngestionRecord {
  id: string;
  connectionId: string;
  topic: WebhookTopic;
  shopDomain: string;
  externalEventId: string;
  status: WebhookProcessingStatus;
  attempts: number;
  errorMessage: string | null;
  orderId: string | null;
  referralCode: string | null;
  discountCode: string | null;
  influencerId: string | null;
  campaignId: string | null;
  conversionId: string | null;
  receivedAt: string;
  processedAt: string | null;
  payloadSummary: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  id: string;
  influencerId: string | null;
  campaignId: string | null;
  type: RewardType;
  title: string;
  description: string;
  value: number | null;
  currency: CurrencyCode;
  status: RewardStatus;
  issuedAt: string | null;
  createdAt: string;
}

export interface SuspiciousEvent {
  id: string;
  influencerId: string;
  referralLinkId: string | null;
  promoCodeId: string | null;
  conversionId: string | null;
  type: SuspiciousEventType;
  severity: SuspiciousEventSeverity;
  status: SuspiciousEventStatus;
  title: string;
  detail: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorProfileId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface DemoAuthAccount {
  id: string;
  profileId: string;
  email: string;
  passwordHash: string;
}

export interface DemoDatabase {
  meta: {
    initializedAt: string;
    version: number;
  };
  authAccounts: DemoAuthAccount[];
  profiles: Profile[];
  influencerApplications: InfluencerApplication[];
  influencers: Influencer[];
  referralLinks: ReferralLink[];
  linkClicks: LinkClick[];
  conversions: Conversion[];
  payouts: Payout[];
  payoutAllocations: PayoutAllocation[];
  storeCatalogItems: StoreCatalogItem[];
  storeSyncJobs: StoreSyncJob[];
  webhookIngestionRecords: WebhookIngestionRecord[];
  promoAssets: PromoAsset[];
  influencerAssetAccess: InfluencerAssetAccess[];
  promoCodes: PromoCode[];
  campaigns: Campaign[];
  rewards: Reward[];
  suspiciousEvents: SuspiciousEvent[];
  programSettings: ProgramSettings;
  storeConnection: StoreConnection;
  auditLogs: AuditLog[];
}

export interface UserSession {
  profileId: string;
  role: Role;
  email: string;
  fullName: string;
  authUserId: string | null;
}

export interface ChartPoint {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
}

export interface DashboardStats {
  clicks: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

export interface ActivityItem {
  id: string;
  type:
    | "click"
    | "conversion"
    | "payout"
    | "application"
    | "promo_code"
    | "campaign"
    | "fraud_flag"
    | "reward";
  title: string;
  detail: string;
  occurredAt: string;
  amount?: number;
}

export interface CampaignWorkspaceItem extends Campaign {
  assets: PromoAsset[];
  promoCodes: PromoCode[];
  referralLinks: ReferralLinkListItem[];
  rewards: Reward[];
  isAssigned: boolean;
}

export interface ReferralLinkListItem extends ReferralLink {
  influencerName: string;
  influencerEmail: string;
  campaignName: string | null;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  lastClickAt: string | null;
  suspiciousEventsCount: number;
}

export interface PromoCodeListItem extends PromoCode {
  influencerName: string;
  influencerEmail: string;
  campaignName: string | null;
  conversions: number;
  revenue: number;
  commission: number;
  suspiciousEventsCount: number;
}

export interface InfluencerDashboardData {
  profile: Profile;
  influencer: Influencer;
  primaryReferralLink: ReferralLink | null;
  stats: DashboardStats;
  performance: ChartPoint[];
  recentActivity: ActivityItem[];
  promoAssets: PromoAsset[];
  latestPayout: Payout | null;
  payoutHistory: Payout[];
  applicationStatus: ApplicationStatus;
  programSettings: ProgramSettings;
  referralLinks: ReferralLinkListItem[];
  promoCodes: PromoCodeListItem[];
  campaigns: CampaignWorkspaceItem[];
  rewards: Reward[];
  suspiciousEvents: SuspiciousEvent[];
}

export interface InfluencerSettingsData {
  profile: Profile;
  influencer: Influencer;
  application: InfluencerApplication | null;
}

export interface ProgramSummary {
  totalCreators: number;
  activeCreators: number;
  countries: number;
  defaultCommissionValue: number;
}

export interface AdminOverviewData {
  kpis: {
    totalInfluencers: number;
    activeInfluencers: number;
    pendingApplications: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    totalCommissionLiability: number;
    pendingPromoCodeRequests: number;
    activeCampaigns: number;
    pendingPayouts: number;
    openFraudFlags: number;
  };
  performance: ChartPoint[];
  recentApplications: ApplicationListItem[];
  topInfluencers: InfluencerListItem[];
  topLinks: ReferralLinkListItem[];
  topPromoCodes: PromoCodeListItem[];
  suspiciousEvents: SuspiciousEvent[];
  defaultCommissionValue: number;
  programSettings: ProgramSettings;
}

export interface ApplicationListItem extends InfluencerApplication {
  reviewerName: string | null;
}

export interface InfluencerListItem extends Influencer {
  fullName: string;
  email: string;
  country: string | null;
  primaryPlatform: PrimaryPlatform;
  audienceSize: AudienceSize;
  applicationStatus: ApplicationStatus;
  stats: DashboardStats;
  primaryReferralLink: ReferralLink | null;
  lastActivityAt: string | null;
  activeCampaigns: number;
  promoCodesCount: number;
}

export interface AffiliateDetailData {
  influencer: InfluencerListItem;
  application: InfluencerApplication | null;
  referralLinks: ReferralLinkListItem[];
  promoCodes: PromoCodeListItem[];
  campaigns: CampaignWorkspaceItem[];
  promoAssets: PromoAsset[];
  conversions: ConversionListItem[];
  payouts: PayoutListItem[];
  rewards: Reward[];
  suspiciousEvents: SuspiciousEvent[];
  recentActivity: ActivityItem[];
}

export interface ConversionListItem extends Conversion {
  influencerName: string;
  referralCode: string | null;
  promoCode: string | null;
  campaignName: string | null;
  attributionLabel: string;
  suspiciousEventsCount: number;
  payoutId: string | null;
  payoutStatus: PayoutStatus | null;
  payoutReference: string | null;
  payoutCreatedAt: string | null;
  isAllocated: boolean;
}

export interface PayoutListItem extends Payout {
  influencerName: string;
  influencerEmail: string;
  allocationsCount: number;
  activeAllocationsCount: number;
  coveredCommission: number;
  coveredRevenue: number;
  releasedCommission: number;
  campaignNames: string[];
}

export interface PayoutAllocationListItem extends PayoutAllocation {
  influencerName: string;
  orderId: string;
  orderAmount: number;
  currency: CurrencyCode;
  commissionAmount: number;
  conversionStatus: ConversionStatus;
  campaignName: string | null;
  referralCode: string | null;
  promoCode: string | null;
}

export interface PayoutDetailData {
  payout: PayoutListItem;
  influencer: InfluencerListItem;
  allocations: PayoutAllocationListItem[];
  availableConversions: ConversionListItem[];
  totals: {
    coveredCommission: number;
    coveredRevenue: number;
    releasedCommission: number;
    openApprovedCommission: number;
    paidCommission: number;
  };
}

export interface CampaignListItem extends Campaign {
  assetsCount: number;
  promoCodesCount: number;
  assignedAffiliateCount: number;
  rewardsCount: number;
}

export interface SuspiciousEventListItem extends SuspiciousEvent {
  influencerName: string;
  referralCode: string | null;
  promoCode: string | null;
}

export interface NavItem {
  title: string;
  href: string;
  icon:
    | "layout-dashboard"
    | "store"
    | "sparkles"
    | "users"
    | "badge-dollar-sign"
    | "wallet"
    | "settings"
    | "images"
    | "link"
    | "ticket-percent"
    | "megaphone"
    | "shield-alert";
}

export interface ApplicationInput {
  fullName: string;
  email: string;
  password: string;
  instagramHandle: string;
  tiktokHandle?: string;
  youtubeHandle?: string;
  primaryPlatform: PrimaryPlatform;
  audienceSize: AudienceSize;
  country: string;
  niche: string;
  message: string;
  consentAccepted: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AffiliateRegistrationInput {
  fullName: string;
  email: string;
  country: string;
  password: string;
  consentAccepted: boolean;
}

export interface InfluencerSettingsInput {
  fullName: string;
  country: string;
  instagramHandle: string;
  tiktokHandle?: string;
  youtubeHandle?: string;
  payoutMethod: PayoutMethod;
  payoutEmail: string;
  companyName?: string;
  taxId?: string;
  notificationEmail?: string;
  notificationsEnabled: boolean;
}

export interface AdminInfluencerInput {
  fullName: string;
  email: string;
  country: string;
  isActive: boolean;
  commissionType: CommissionType;
  commissionValue: number;
  payoutMethod: PayoutMethod;
  payoutEmail: string;
  notes?: string;
}

export interface ConversionInput {
  influencerId: string;
  referralLinkId?: string | null;
  promoCodeId?: string | null;
  orderId: string;
  customerEmail?: string;
  orderAmount: number;
  currency: CurrencyCode;
  commissionType: CommissionType;
  commissionValue: number;
  attributionSource?: AttributionSource;
  status: ConversionStatus;
  createdAt?: string;
}

export interface PayoutUpdateInput {
  payoutId: string;
  status: PayoutStatus;
  reference?: string;
}

export interface PayoutBatchInput {
  influencerId: string;
  conversionIds: string[];
  method: PayoutMethod;
  status: Exclude<PayoutStatus, "failed">;
  reference?: string;
}

export interface PromoAssetInput {
  id?: string;
  title: string;
  type: PromoAssetType;
  fileUrl: string;
  description: string;
  caption?: string;
  instructions?: string;
  campaignId?: string | null;
  isActive: boolean;
}

export interface ReferralLinkInput {
  name: string;
  destinationUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  campaignId?: string | null;
}

export interface ReferralLinkStatusInput {
  linkId: string;
  isActive: boolean;
}

export interface PromoCodeCreateInput {
  action: "generate" | "request";
  desiredCode?: string;
  campaignId?: string | null;
  requestMessage?: string;
}

export interface AdminPromoCodeInput {
  influencerId: string;
  code?: string;
  campaignId?: string | null;
  discountValue: number;
  isPrimary: boolean;
}

export interface PromoCodeReviewInput {
  promoCodeId: string;
  status: "active" | "rejected" | "disabled";
  finalCode?: string;
}

export interface CampaignInput {
  id?: string;
  name: string;
  description: string;
  landingUrl: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  commissionType: CommissionType | "default";
  commissionValue?: number | null;
  bonusTitle?: string;
  bonusDescription?: string;
  bonusType?: RewardType | null;
  bonusValue?: number | null;
  appliesToAll: boolean;
  affiliateIds: string[];
}

export interface ProgramSettingsInput {
  allowAffiliateCodeGeneration: boolean;
  allowPromoCodeRequests: boolean;
  allowCustomLinkDestinations: boolean;
  promoCodePrefix: string;
  emailBrandName: string;
  emailReplyTo: string;
  antiLeakEnabled: boolean;
  blockSelfReferrals: boolean;
  requireCodeOwnershipMatch: boolean;
  fraudReviewEnabled: boolean;
  maxClicksPerIpPerDay: number;
  maxConversionsPerIpPerDay: number;
  enableRewards: boolean;
  enableStoreCredit: boolean;
  enableMarketplace: boolean;
  enableMultiLevel: boolean;
  enableMultiProgram: boolean;
  enableAutoPayouts: boolean;
  allowedDestinationUrls: string[];
}

export interface StoreConnectionInput {
  storeName: string;
  shopDomain: string;
  storefrontUrl: string;
  defaultDestinationUrl: string;
  installState: ShopifyInstallState;
  status: StoreConnectionStatus;
  syncProductsEnabled: boolean;
  syncDiscountCodesEnabled: boolean;
  orderAttributionEnabled: boolean;
  autoCreateDiscountCodes: boolean;
  appEmbedEnabled: boolean;
  grantedScopes: string[];
}

export interface StoreCatalogRulesInput {
  defaultDestinationUrl: string;
  enabledDestinationUrls: string[];
}

export interface StoreSyncJobInput {
  type: StoreSyncJobType;
  mode: StoreSyncJobMode;
  notes?: string;
}

export interface StoreWebhookIngestionInput {
  topic: WebhookTopic;
  orderId: string;
  orderAmount?: number | null;
  currency: CurrencyCode;
  customerEmail?: string | null;
  referralCode?: string | null;
  discountCode?: string | null;
}

export interface ApplicationApprovalInput {
  reviewNotes?: string;
  commissionType: CommissionType;
  commissionValue: number;
  payoutMethod: PayoutMethod;
  campaignId?: string | null;
}

export interface ApplicationRejectionInput {
  reviewNotes?: string;
}

export interface SuspiciousEventReviewInput {
  suspiciousEventId: string;
  status: SuspiciousEventStatus;
}

export interface ManualSuspiciousEventInput {
  influencerId: string;
  title: string;
  detail: string;
  severity: SuspiciousEventSeverity;
}

export interface ClickTrackingInput {
  slug: string;
  referrer: string | null;
  userAgent: string | null;
  ipHash: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
  redirectTo?: string;
}

export interface Repository {
  getProgramSummary(): Promise<ProgramSummary>;
  createApplication(input: ApplicationInput): Promise<InfluencerApplication>;
  authenticateWithPassword(input: LoginInput): Promise<UserSession | null>;
  getProfileById(profileId: string): Promise<Profile | null>;
  getProfileByAuthUserId(authUserId: string): Promise<Profile | null>;
  getApplicationStatusForProfile(profileId: string): Promise<ApplicationStatus | null>;
  getInfluencerDashboard(profileId: string): Promise<InfluencerDashboardData | null>;
  getInfluencerSettings(profileId: string): Promise<InfluencerSettingsData | null>;
  updateInfluencerSettings(
    profileId: string,
    input: InfluencerSettingsInput,
  ): Promise<InfluencerSettingsData>;
  getAdminOverview(): Promise<AdminOverviewData>;
  listApplications(status?: ApplicationStatus | "all"): Promise<ApplicationListItem[]>;
  approveApplication(
    applicationId: string,
    reviewerProfileId: string,
    input: ApplicationApprovalInput,
  ): Promise<Influencer>;
  rejectApplication(
    applicationId: string,
    reviewerProfileId: string,
    reason?: string | null,
  ): Promise<void>;
  listInfluencers(search?: string): Promise<InfluencerListItem[]>;
  getAffiliateDetail(influencerId: string): Promise<AffiliateDetailData | null>;
  updateInfluencerAdmin(
    influencerId: string,
    input: AdminInfluencerInput,
  ): Promise<Influencer>;
  listReferralLinks(search?: string): Promise<ReferralLinkListItem[]>;
  createReferralLink(
    profileId: string,
    input: ReferralLinkInput,
  ): Promise<ReferralLink>;
  updateReferralLinkStatus(
    input: ReferralLinkStatusInput,
    actorProfileId: string,
  ): Promise<ReferralLink>;
  archiveReferralLink(profileId: string, linkId: string): Promise<ReferralLink>;
  listPromoCodes(status?: PromoCodeStatus | "all"): Promise<PromoCodeListItem[]>;
  createPromoCodeForInfluencer(
    profileId: string,
    input: PromoCodeCreateInput,
  ): Promise<PromoCode>;
  assignPromoCode(
    input: AdminPromoCodeInput,
    actorProfileId: string,
  ): Promise<PromoCode>;
  reviewPromoCode(
    input: PromoCodeReviewInput,
    actorProfileId: string,
  ): Promise<PromoCode>;
  listCampaigns(): Promise<CampaignListItem[]>;
  createCampaign(
    input: CampaignInput,
    actorProfileId: string,
  ): Promise<Campaign>;
  updateCampaign(
    input: CampaignInput,
    actorProfileId: string,
  ): Promise<Campaign>;
  getStoreConnection(): Promise<StoreConnection>;
  updateStoreConnection(
    input: StoreConnectionInput,
    actorProfileId: string,
  ): Promise<StoreConnection>;
  listStoreCatalogItems(): Promise<StoreCatalogItem[]>;
  updateStoreCatalogRules(
    input: StoreCatalogRulesInput,
    actorProfileId: string,
  ): Promise<StoreConnection>;
  listStoreSyncJobs(): Promise<StoreSyncJob[]>;
  triggerStoreSync(
    input: StoreSyncJobInput,
    actorProfileId: string,
  ): Promise<StoreSyncJob>;
  retryStoreSyncJob(
    jobId: string,
    actorProfileId: string,
  ): Promise<StoreSyncJob>;
  listWebhookIngestionRecords(
    status?: WebhookProcessingStatus | "all",
  ): Promise<WebhookIngestionRecord[]>;
  ingestStoreWebhook(
    input: StoreWebhookIngestionInput,
    actorProfileId: string,
  ): Promise<WebhookIngestionRecord>;
  retryWebhookIngestion(
    recordId: string,
    actorProfileId: string,
  ): Promise<WebhookIngestionRecord>;
  updateProgramSettings(
    input: ProgramSettingsInput,
    actorProfileId: string,
  ): Promise<ProgramSettings>;
  listConversions(): Promise<ConversionListItem[]>;
  createConversion(
    input: ConversionInput,
    actorProfileId: string,
  ): Promise<Conversion>;
  listSuspiciousEvents(
    status?: SuspiciousEventStatus | "all",
    influencerId?: string,
  ): Promise<SuspiciousEventListItem[]>;
  reviewSuspiciousEvent(
    input: SuspiciousEventReviewInput,
    actorProfileId: string,
  ): Promise<SuspiciousEvent>;
  createManualSuspiciousEvent(
    input: ManualSuspiciousEventInput,
    actorProfileId: string,
  ): Promise<SuspiciousEvent>;
  listPayouts(): Promise<PayoutListItem[]>;
  getPayoutDetail(payoutId: string): Promise<PayoutDetailData | null>;
  createPayoutBatch(
    input: PayoutBatchInput,
    actorProfileId: string,
  ): Promise<Payout>;
  updatePayout(input: PayoutUpdateInput): Promise<Payout>;
  listPromoAssets(): Promise<PromoAsset[]>;
  upsertPromoAsset(
    input: PromoAssetInput,
    actorProfileId: string,
  ): Promise<PromoAsset>;
  trackReferralClick(input: ClickTrackingInput): Promise<string | null>;
}

import {
  DEFAULT_COMMISSION_TYPE,
  DEFAULT_COMMISSION_VALUE,
  DEFAULT_CURRENCY,
  DEFAULT_REFERRAL_BASE_PATH,
  DEFAULT_REFERRAL_DESTINATION_PATH,
  SHOPIFY_SCOPE_VALUES,
  demoCredentials,
  destinationOptions,
} from "@/lib/constants";
import type {
  ApplicationStatus,
  Campaign,
  DemoDatabase,
  Influencer,
  InfluencerApplication,
  PayoutMethod,
  Profile,
  PromoCode,
  ReferralLink,
  Reward,
  Role,
  StoreConnection,
  StoreSyncJob,
  SuspiciousEvent,
  WebhookIngestionRecord,
} from "@/lib/types";
import {
  appendQueryParams,
  calculateCommission,
  createAbsoluteUrl,
  generateDiscountCode,
  generatePromoCode,
  generateReferralSlug,
  hashPassword,
} from "@/lib/utils";

function isoDaysAgo(daysAgo: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function createProfile(params: {
  id: string;
  authUserId: string;
  role: Role;
  fullName: string;
  email: string;
  country: string;
  createdAt: string;
}) {
  return {
    id: params.id,
    authUserId: params.authUserId,
    role: params.role,
    fullName: params.fullName,
    email: params.email,
    avatarUrl: null,
    country: params.country,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  } satisfies Profile;
}

function createApplication(params: {
  id: string;
  profileId: string | null;
  authUserId: string | null;
  fullName: string;
  email: string;
  instagramHandle: string;
  tiktokHandle?: string | null;
  youtubeHandle?: string | null;
  primaryPlatform: "instagram" | "tiktok" | "youtube" | "multi-platform";
  audienceSize: "0-1k" | "1k-5k" | "5k-10k" | "10k-25k" | "25k-100k" | "100k+";
  country: string;
  niche: string;
  message: string;
  status: ApplicationStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}) {
  return {
    id: params.id,
    profileId: params.profileId,
    authUserId: params.authUserId,
    fullName: params.fullName,
    email: params.email,
    instagramHandle: params.instagramHandle,
    tiktokHandle: params.tiktokHandle ?? null,
    youtubeHandle: params.youtubeHandle ?? null,
    primaryPlatform: params.primaryPlatform,
    audienceSize: params.audienceSize,
    country: params.country,
    niche: params.niche,
    message: params.message,
    consentAccepted: true,
    status: params.status,
    reviewedBy: params.reviewedBy ?? null,
    reviewNotes: params.reviewNotes ?? null,
    reviewedAt: params.reviewedAt ?? null,
    createdAt: params.createdAt,
    updatedAt: params.reviewedAt ?? params.createdAt,
  } satisfies InfluencerApplication;
}

function createInfluencer(
  profile: Profile,
  application: InfluencerApplication,
  payoutMethod: PayoutMethod,
) {
  const fullName = profile.fullName;

  return {
    id: `inf_${profile.id}`,
    profileId: profile.id,
    applicationId: application.id,
    publicSlug: generateReferralSlug(fullName, []),
    discountCode: generateDiscountCode(fullName, []),
    commissionType: DEFAULT_COMMISSION_TYPE,
    commissionValue: DEFAULT_COMMISSION_VALUE,
    isActive: true,
    payoutMethod,
    payoutProviderStatus: payoutMethod === "paypal" ? "ready" : "not_connected",
    payoutEmail: profile.email,
    companyName: null,
    taxId: null,
    notificationEmail: profile.email,
    notificationsEnabled: true,
    notes: `${fullName} fa parte della coorte demo ad alto potenziale.`,
    createdAt: application.createdAt,
    updatedAt: application.createdAt,
  } satisfies Influencer;
}

function campaignAppliesToAffiliate(campaign: Campaign, influencerId: string) {
  return campaign.appliesToAll || campaign.affiliateIds.includes(influencerId);
}

export function createSeedDatabase() {
  const adminCreatedAt = isoDaysAgo(120, 9);
  const lunaCreatedAt = isoDaysAgo(90, 13);
  const nicoCreatedAt = isoDaysAgo(72, 14);
  const mayaCreatedAt = isoDaysAgo(45, 15);
  const sophiaCreatedAt = isoDaysAgo(3, 11);
  const carmenCreatedAt = isoDaysAgo(18, 10);

  const admin = createProfile({
    id: "profile_admin",
    authUserId: "auth_admin",
    role: "ADMIN",
    fullName: "Ari Bennett",
    email: demoCredentials.admin.email,
    country: "Stati Uniti",
    createdAt: adminCreatedAt,
  });

  const luna = createProfile({
    id: "profile_luna",
    authUserId: "auth_luna",
    role: "INFLUENCER",
    fullName: "Luna Voss",
    email: demoCredentials.influencer.email,
    country: "Regno Unito",
    createdAt: lunaCreatedAt,
  });

  const nico = createProfile({
    id: "profile_nico",
    authUserId: "auth_nico",
    role: "INFLUENCER",
    fullName: "Nico Hart",
    email: "nico@affinity-demo.com",
    country: "Italia",
    createdAt: nicoCreatedAt,
  });

  const maya = createProfile({
    id: "profile_maya",
    authUserId: "auth_maya",
    role: "INFLUENCER",
    fullName: "Maya Lin",
    email: "maya@affinity-demo.com",
    country: "Canada",
    createdAt: mayaCreatedAt,
  });

  const sophia = createProfile({
    id: "profile_sophia",
    authUserId: "auth_sophia",
    role: "INFLUENCER",
    fullName: "Sophia Vale",
    email: demoCredentials.pending.email,
    country: "Stati Uniti",
    createdAt: sophiaCreatedAt,
  });

  const lunaApplication = createApplication({
    id: "app_luna",
    profileId: luna.id,
    authUserId: luna.authUserId,
    fullName: luna.fullName,
    email: luna.email,
    instagramHandle: "lunavoss",
    tiktokHandle: "lunaedits",
    primaryPlatform: "instagram",
    audienceSize: "25k-100k",
    country: luna.country ?? "Regno Unito",
    niche: "Lifestyle",
    message:
      "Mi piacciono i brand DTC curati e so creare reel, stories e set fotografici raffinati attorno ai rituali di prodotto.",
    status: "approved",
    reviewedBy: admin.id,
    reviewedAt: isoDaysAgo(88, 16),
    createdAt: lunaCreatedAt,
  });

  const nicoApplication = createApplication({
    id: "app_nico",
    profileId: nico.id,
    authUserId: nico.authUserId,
    fullName: nico.fullName,
    email: nico.email,
    instagramHandle: "nicohartstudio",
    youtubeHandle: "NicoHartStudio",
    primaryPlatform: "youtube",
    audienceSize: "10k-25k",
    country: nico.country ?? "Italia",
    niche: "Tech e desk setup",
    message:
      "Il mio pubblico risponde bene a recensioni approfondite di creator tools e contenuti premium sul workspace.",
    status: "approved",
    reviewedBy: admin.id,
    reviewedAt: isoDaysAgo(70, 18),
    createdAt: nicoCreatedAt,
  });

  const mayaApplication = createApplication({
    id: "app_maya",
    profileId: maya.id,
    authUserId: maya.authUserId,
    fullName: maya.fullName,
    email: maya.email,
    instagramHandle: "mayalincurates",
    tiktokHandle: "maya.curates",
    primaryPlatform: "multi-platform",
    audienceSize: "5k-10k",
    country: maya.country ?? "Canada",
    niche: "Beauty",
    message:
      "Mi concentro su storytelling beauty premium, con forte intento di conversione e visual puliti adatti al brand.",
    status: "approved",
    reviewedBy: admin.id,
    reviewedAt: isoDaysAgo(42, 13),
    createdAt: mayaCreatedAt,
  });

  const sophiaApplication = createApplication({
    id: "app_sophia",
    profileId: sophia.id,
    authUserId: sophia.authUserId,
    fullName: sophia.fullName,
    email: sophia.email,
    instagramHandle: "sophiavale.co",
    tiktokHandle: "sophiavale",
    primaryPlatform: "instagram",
    audienceSize: "1k-5k",
    country: sophia.country ?? "Stati Uniti",
    niche: "Fashion",
    message:
      "Voglio crescere insieme a un programma premium e costruire contenuti evergreen ben pensati attorno ai vostri prodotti.",
    status: "pending",
    createdAt: sophiaCreatedAt,
  });

  const carmenApplication = createApplication({
    id: "app_carmen",
    profileId: null,
    authUserId: null,
    fullName: "Carmen Bloom",
    email: "carmen@example.com",
    instagramHandle: "carmenblooms",
    primaryPlatform: "instagram",
    audienceSize: "0-1k",
    country: "Spagna",
    niche: "Travel",
    message:
      "Mi candido per testare il programma e capire come i contenuti affiliate possono performare con il mio pubblico.",
    status: "rejected",
    reviewedBy: admin.id,
    reviewedAt: isoDaysAgo(16, 12),
    reviewNotes: "Il fit del pubblico e ancora troppo iniziale per il brief campagna attuale.",
    createdAt: carmenCreatedAt,
  });

  const lunaInfluencer = createInfluencer(luna, lunaApplication, "paypal");
  const nicoInfluencer = createInfluencer(nico, nicoApplication, "bank_transfer");
  const mayaInfluencer = createInfluencer(maya, mayaApplication, "paypal");

  lunaInfluencer.publicSlug = "luna-voss";
  lunaInfluencer.discountCode = "LUNAVOSS10";
  nicoInfluencer.publicSlug = "nico-hart";
  nicoInfluencer.discountCode = "NICOHART10";
  mayaInfluencer.publicSlug = "maya-lin";
  mayaInfluencer.discountCode = "MAYALIN10";
  mayaInfluencer.commissionValue = 18;

  const influencers = [lunaInfluencer, nicoInfluencer, mayaInfluencer];

  const campaignLandingUrls = {
    holiday: createAbsoluteUrl("/shop?collection=holiday-drop"),
    desk: createAbsoluteUrl("/shop?collection=desk-setup"),
    glow: createAbsoluteUrl("/shop?collection=skin-glow"),
  };
  const seedNow = new Date().toISOString();
  const storeCatalogItems: DemoDatabase["storeCatalogItems"] = [
    {
      id: "store_home",
      shopifyResourceId: "gid://shopify/OnlineStorePage/home",
      title: "Vetrina",
      type: "homepage",
      handle: null,
      destinationUrl: createAbsoluteUrl("/shop"),
      isAffiliateEnabled: true,
      isFeatured: true,
      createdAt: adminCreatedAt,
      updatedAt: seedNow,
    },
    {
      id: "store_collection_bestsellers",
      shopifyResourceId: "gid://shopify/Collection/1001",
      title: "Best seller",
      type: "collection",
      handle: "best-sellers",
      destinationUrl: createAbsoluteUrl("/shop?collection=best-sellers"),
      isAffiliateEnabled: true,
      isFeatured: true,
      createdAt: adminCreatedAt,
      updatedAt: seedNow,
    },
    {
      id: "store_collection_new_arrivals",
      shopifyResourceId: "gid://shopify/Collection/1002",
      title: "Novita",
      type: "collection",
      handle: "new-arrivals",
      destinationUrl: createAbsoluteUrl("/shop?collection=new-arrivals"),
      isAffiliateEnabled: true,
      isFeatured: true,
      createdAt: adminCreatedAt,
      updatedAt: seedNow,
    },
    {
      id: "store_collection_creator_picks",
      shopifyResourceId: "gid://shopify/Collection/1003",
      title: "Selezione creator",
      type: "collection",
      handle: "creator-picks",
      destinationUrl: createAbsoluteUrl("/shop?collection=creator-picks"),
      isAffiliateEnabled: true,
      isFeatured: false,
      createdAt: adminCreatedAt,
      updatedAt: seedNow,
    },
    {
      id: "store_product_luna_lamp",
      shopifyResourceId: "gid://shopify/Product/2001",
      title: "Luma Desk Lamp",
      type: "product",
      handle: "luma-desk-lamp",
      destinationUrl: createAbsoluteUrl("/shop/products/luma-desk-lamp"),
      isAffiliateEnabled: true,
      isFeatured: false,
      createdAt: adminCreatedAt,
      updatedAt: seedNow,
    },
    {
      id: "store_product_canvas_kit",
      shopifyResourceId: "gid://shopify/Product/2002",
      title: "Canvas Creator Kit",
      type: "product",
      handle: "canvas-creator-kit",
      destinationUrl: createAbsoluteUrl("/shop/products/canvas-creator-kit"),
      isAffiliateEnabled: false,
      isFeatured: false,
      createdAt: adminCreatedAt,
      updatedAt: seedNow,
    },
  ];

  const campaigns: Campaign[] = [
    {
      id: "campaign_holiday",
      name: "Spinta Holiday Drop",
      description:
        "Una spinta stagionale focalizzata su bundle regalo, bundle premium e traffico storefront ad alta intenzione.",
      landingUrl: campaignLandingUrls.holiday,
      startDate: isoDaysAgo(12, 9),
      endDate: isoDaysAgo(-18, 9),
      status: "active",
      commissionType: "percentage",
      commissionValue: 18,
      bonusTitle: "Booster fatturato holiday",
      bonusDescription: "Bonus cash extra quando l'affiliato supera la soglia di fatturato sui bundle regalo.",
      bonusType: "cash_bonus",
      bonusValue: 150,
      appliesToAll: true,
      affiliateIds: [],
      createdAt: isoDaysAgo(14, 9),
      updatedAt: isoDaysAgo(10, 9),
    },
    {
      id: "campaign_creator_studio",
      name: "Creator Studio Essentials",
      description:
        "Focus su desk setup e prodotti per il workflow creator, con contenuti educational e angoli comparativi.",
      landingUrl: campaignLandingUrls.desk,
      startDate: isoDaysAgo(20, 10),
      endDate: isoDaysAgo(22, 10),
      status: "active",
      commissionType: null,
      commissionValue: null,
      bonusTitle: "Kit campioni desk setup",
      bonusDescription: "Creator kit omaggio per affiliati che producono contenuti long form sul desk setup.",
      bonusType: "gift",
      bonusValue: null,
      appliesToAll: false,
      affiliateIds: [lunaInfluencer.id, nicoInfluencer.id],
      createdAt: isoDaysAgo(24, 10),
      updatedAt: isoDaysAgo(18, 10),
    },
    {
      id: "campaign_glow_weekend",
      name: "Test Glow Weekend",
      description:
        "Una campagna verticale per affiliati beauty, con prompt copy piu leggeri, hook short form e bundle UGC.",
      landingUrl: campaignLandingUrls.glow,
      startDate: isoDaysAgo(3, 9),
      endDate: isoDaysAgo(-9, 9),
      status: "scheduled",
      commissionType: "fixed",
      commissionValue: 12,
      bonusTitle: "Bonus credito Glow",
      bonusDescription: "Credito store assegnato agli affiliati che pubblicano due placement approvati nel weekend di lancio.",
      bonusType: "store_credit",
      bonusValue: 75,
      appliesToAll: false,
      affiliateIds: [mayaInfluencer.id],
      createdAt: isoDaysAgo(7, 9),
      updatedAt: isoDaysAgo(3, 9),
    },
  ];

  const referralLinks: ReferralLink[] = influencers.flatMap((influencer, index) => {
    const primaryLink: ReferralLink = {
      id: `link_${influencer.id}`,
      influencerId: influencer.id,
      name: "Link principale storefront",
      code: influencer.publicSlug,
      destinationUrl: createAbsoluteUrl(
        `${DEFAULT_REFERRAL_DESTINATION_PATH}?ref=${influencer.publicSlug}`,
      ),
      isPrimary: true,
      isActive: true,
      archivedAt: null,
      campaignId: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      createdAt: influencer.createdAt,
    };

    const campaignLink: ReferralLink = {
      id: `link_${influencer.id}_campaign`,
      influencerId: influencer.id,
      name: index === 2 ? "Link stories Glow Weekend" : "Link campagna holiday",
      code:
        index === 2
          ? `${influencer.publicSlug}-glow`
          : `${influencer.publicSlug}-holiday`,
      destinationUrl:
        index === 2
          ? appendQueryParams(campaignLandingUrls.glow, {
              ref: influencer.publicSlug,
              utm_source: "instagram",
              utm_medium: "story",
              utm_campaign: "glow-weekend",
            })
          : appendQueryParams(campaignLandingUrls.holiday, {
              ref: influencer.publicSlug,
              utm_source: index === 0 ? "instagram" : "youtube",
              utm_medium: "social",
              utm_campaign: "holiday-drop",
            }),
      isPrimary: false,
      isActive: true,
      archivedAt: null,
      campaignId: index === 2 ? "campaign_glow_weekend" : "campaign_holiday",
      utmSource: index === 2 ? "instagram" : index === 0 ? "instagram" : "youtube",
      utmMedium: index === 2 ? "story" : "social",
      utmCampaign: index === 2 ? "glow-weekend" : "holiday-drop",
      createdAt: isoDaysAgo(10 + index, 12),
    };

    return [primaryLink, campaignLink];
  });

  const promoAssets = [
    {
      id: "asset_launch_kit",
      title: "Kit lancio Holiday",
      type: "image" as const,
      fileUrl: "https://example.com/assets/holiday-launch-kit.zip",
      description: "Story card, promo verticali e crop quadrati per la holiday drop.",
      caption:
        "Usalo per presentare il drop con un angolo premium orientato al gifting e una CTA forte.",
      instructions:
        "Apri sul gifting, mantieni l'offerta visibile nel frame e abbina l'asset al codice della campagna holiday.",
      campaignId: "campaign_holiday",
      isActive: true,
      createdAt: isoDaysAgo(30, 9),
    },
    {
      id: "asset_brand_copy",
      title: "Caption studio ad alta conversione",
      type: "copy" as const,
      fileUrl: "https://example.com/assets/studio-captions.pdf",
      description: "Aperture caption approvate, gestione obiezioni e varianti CTA per contenuti sul workflow creator.",
      caption:
        "Un pacchetto caption curato per demo desk setup, creator routine e reel produttivita.",
      instructions:
        "Usa queste caption per contenuti tutorial e abbinale al tuo link creator-studio per l'attribuzione.",
      campaignId: "campaign_creator_studio",
      isActive: true,
      createdAt: isoDaysAgo(20, 9),
    },
    {
      id: "asset_guidelines",
      title: "Brief Glow Weekend",
      type: "brand_guide" as const,
      fileUrl: "https://example.com/assets/glow-weekend-brief.pdf",
      description: "Indicazioni di tono, sintesi offerta e direzione visiva per la campagna Glow Weekend.",
      caption:
        "Mantieni il contenuto aspirazionale, pulito e guidato dal creator, con focus su rituale prodotto e facilità d'uso.",
      instructions:
        "Ricorda la finestra di lancio limitata e mantieni il copy conciso per i placement short form.",
      campaignId: "campaign_glow_weekend",
      isActive: true,
      createdAt: isoDaysAgo(25, 9),
    },
  ];

  const influencerAssetAccess = influencers.flatMap((influencer) =>
    promoAssets
      .filter((asset) => {
        if (!asset.campaignId) {
          return true;
        }

        const campaign = campaigns.find((item) => item.id === asset.campaignId);
        return campaign ? campaignAppliesToAffiliate(campaign, influencer.id) : false;
      })
      .map((asset) => ({
        id: `access_${influencer.id}_${asset.id}`,
        influencerId: influencer.id,
        assetId: asset.id,
        createdAt: asset.createdAt,
      })),
  );

  const promoCodes: PromoCode[] = [
    {
      id: "code_luna_primary",
      influencerId: lunaInfluencer.id,
      campaignId: null,
      code: lunaInfluencer.discountCode,
      discountValue: 10,
      status: "active",
      source: "assigned",
      isPrimary: true,
      requestMessage: null,
      approvedBy: admin.id,
      createdAt: lunaInfluencer.createdAt,
      updatedAt: lunaInfluencer.createdAt,
    },
    {
      id: "code_nico_primary",
      influencerId: nicoInfluencer.id,
      campaignId: null,
      code: nicoInfluencer.discountCode,
      discountValue: 10,
      status: "active",
      source: "assigned",
      isPrimary: true,
      requestMessage: null,
      approvedBy: admin.id,
      createdAt: nicoInfluencer.createdAt,
      updatedAt: nicoInfluencer.createdAt,
    },
    {
      id: "code_maya_primary",
      influencerId: mayaInfluencer.id,
      campaignId: null,
      code: mayaInfluencer.discountCode,
      discountValue: 10,
      status: "active",
      source: "assigned",
      isPrimary: true,
      requestMessage: null,
      approvedBy: admin.id,
      createdAt: mayaInfluencer.createdAt,
      updatedAt: mayaInfluencer.createdAt,
    },
    {
      id: "code_luna_holiday",
      influencerId: lunaInfluencer.id,
      campaignId: "campaign_holiday",
      code: generatePromoCode(luna.fullName, [lunaInfluencer.discountCode], "AFF", "LUNA-GIFT"),
      discountValue: 15,
      status: "active",
      source: "generated",
      isPrimary: false,
      requestMessage: null,
      approvedBy: admin.id,
      createdAt: isoDaysAgo(9, 15),
      updatedAt: isoDaysAgo(9, 15),
    },
    {
      id: "code_nico_studio",
      influencerId: nicoInfluencer.id,
      campaignId: "campaign_creator_studio",
      code: generatePromoCode(nico.fullName, [nicoInfluencer.discountCode], "AFF", "NICO-DESK"),
      discountValue: 12,
      status: "active",
      source: "generated",
      isPrimary: false,
      requestMessage: null,
      approvedBy: admin.id,
      createdAt: isoDaysAgo(12, 15),
      updatedAt: isoDaysAgo(12, 15),
    },
    {
      id: "code_maya_request",
      influencerId: mayaInfluencer.id,
      campaignId: "campaign_glow_weekend",
      code: "MAYA-GLOW",
      discountValue: 12,
      status: "pending",
      source: "requested",
      isPrimary: false,
      requestMessage: "Mi serve un codice piu corto per overlay TikTok e sticker nelle stories.",
      approvedBy: null,
      createdAt: isoDaysAgo(2, 11),
      updatedAt: isoDaysAgo(2, 11),
    },
  ];

  const linkClicks: DemoDatabase["linkClicks"] = [];
  const conversions: DemoDatabase["conversions"] = [];
  const payouts: DemoDatabase["payouts"] = [];
  const payoutAllocations: DemoDatabase["payoutAllocations"] = [];
  const rewards: Reward[] = [];
  const suspiciousEvents: SuspiciousEvent[] = [];

  influencers.forEach((influencer, influencerIndex) => {
    const influencerLinks = referralLinks.filter((link) => link.influencerId === influencer.id);
    const primaryLink = influencerLinks.find((link) => link.isPrimary) ?? influencerLinks[0];
    const campaignLink = influencerLinks.find((link) => !link.isPrimary) ?? primaryLink;
    const influencerPromoCodes = promoCodes.filter(
      (promoCode) => promoCode.influencerId === influencer.id && promoCode.status === "active",
    );
    const primaryPromoCode =
      influencerPromoCodes.find((promoCode) => promoCode.isPrimary) ?? influencerPromoCodes[0];
    const campaignPromoCode =
      influencerPromoCodes.find((promoCode) => promoCode.campaignId) ?? primaryPromoCode;

    for (let day = 28; day >= 0; day -= 1) {
      const clickCount = 2 + ((day + influencerIndex * 2) % 5);

      for (let clickIndex = 0; clickIndex < clickCount; clickIndex += 1) {
        const createdAt = isoDaysAgo(day, 9 + (clickIndex % 6));
        const useCampaignLink = clickIndex % 3 === 0;
        const activeLink = useCampaignLink ? campaignLink : primaryLink;

        linkClicks.push({
          id: `click_${influencer.id}_${day}_${clickIndex}`,
          influencerId: influencer.id,
          referralLinkId: activeLink?.id ?? null,
          visitorId: `visitor_${influencerIndex}_${day}_${clickIndex}`,
          referrer: clickIndex % 2 === 0 ? "https://instagram.com" : null,
          userAgent: "Mozilla/5.0",
          ipHash: `iphash_${influencerIndex}_${day}_${clickIndex}`,
          utmSource: activeLink?.utmSource ?? (clickIndex % 2 === 0 ? "instagram" : "tiktok"),
          utmMedium: activeLink?.utmMedium ?? "social",
          utmCampaign: activeLink?.utmCampaign ?? influencer.publicSlug,
          createdAt,
        });
      }

      if (day === 1 && influencerIndex === 1) {
        for (let anomalyIndex = 0; anomalyIndex < 8; anomalyIndex += 1) {
          linkClicks.push({
            id: `click_anomaly_${influencer.id}_${anomalyIndex}`,
            influencerId: influencer.id,
            referralLinkId: campaignLink?.id ?? null,
            visitorId: `anomaly_visitor_${anomalyIndex}`,
            referrer: "https://example.com",
            userAgent: "Mozilla/5.0",
            ipHash: "iphash_repeated_nico",
            utmSource: campaignLink?.utmSource ?? "instagram",
            utmMedium: campaignLink?.utmMedium ?? "social",
            utmCampaign: campaignLink?.utmCampaign ?? "studio",
            createdAt: isoDaysAgo(day, 18),
          });
        }
      }

      const shouldCreateConversion = (day + influencerIndex) % 4 === 0;

      if (shouldCreateConversion) {
        const orderAmount = 60 + influencerIndex * 35 + (day % 3) * 22;
        const commissionAmount = calculateCommission(
          orderAmount,
          influencer.commissionType,
          influencer.commissionValue,
        );
        const createdAt = isoDaysAgo(day, 14);
        const status =
          day < 8 ? "paid" : day < 16 ? "approved" : "pending";

        conversions.push({
          id: `conv_${influencer.id}_${day}`,
          influencerId: influencer.id,
          referralLinkId: day % 2 === 0 ? campaignLink?.id ?? null : primaryLink?.id ?? null,
          promoCodeId: day % 2 === 0 ? campaignPromoCode?.id ?? null : primaryPromoCode?.id ?? null,
          orderId: `ORD-${influencerIndex + 1}${String(day).padStart(3, "0")}`,
          customerEmail:
            influencer.id === lunaInfluencer.id && day === 12
              ? luna.email
              : `customer${day}@example.com`,
          orderAmount,
          currency: DEFAULT_CURRENCY,
          commissionType: influencer.commissionType,
          commissionValue: influencer.commissionValue,
          commissionAmount,
          attributionSource:
            day % 6 === 0
              ? "hybrid"
              : day % 2 === 0
                ? "promo_code"
                : "link",
          status,
          createdAt,
          updatedAt: createdAt,
        });
      }
    }

    const paidConversions = conversions
      .filter(
        (conversion) =>
          conversion.influencerId === influencer.id && conversion.status === "paid",
      )
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
    const approvedConversions = conversions
      .filter(
        (conversion) =>
          conversion.influencerId === influencer.id && conversion.status === "approved",
      )
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );

    if (paidConversions.length) {
      const settledPayoutId = `payout_${influencer.id}_settled`;
      const settledCreatedAt = isoDaysAgo(6 + influencerIndex, 16);
      payouts.push({
        id: settledPayoutId,
        influencerId: influencer.id,
        amount: Number(
          paidConversions
            .reduce((sum, conversion) => sum + conversion.commissionAmount, 0)
            .toFixed(2),
        ),
        currency: DEFAULT_CURRENCY,
        status: "paid",
        method: influencer.payoutMethod ?? "manual",
        reference: `PAYOUT-${influencer.id.slice(-4).toUpperCase()}`,
        paidAt: isoDaysAgo(5 + influencerIndex),
        createdAt: settledCreatedAt,
      });

      paidConversions.forEach((conversion) => {
        payoutAllocations.push({
          id: `payout_alloc_${settledPayoutId}_${conversion.id}`,
          payoutId: settledPayoutId,
          conversionId: conversion.id,
          influencerId: influencer.id,
          amount: conversion.commissionAmount,
          releasedAt: null,
          createdAt: settledCreatedAt,
        });
      });
    }

    const queuedApprovedConversions =
      influencer.id === nicoInfluencer.id
        ? approvedConversions.slice(0, 2)
        : influencer.id === mayaInfluencer.id
          ? approvedConversions.slice(0, 1)
          : [];

    if (queuedApprovedConversions.length) {
      const queuedPayoutId = `payout_${influencer.id}_queue`;
      const queuedCreatedAt = isoDaysAgo(2 + influencerIndex, 17);
      const queuedStatus = influencer.id === mayaInfluencer.id ? "processing" : "pending";
      payouts.push({
        id: queuedPayoutId,
        influencerId: influencer.id,
        amount: Number(
          queuedApprovedConversions
            .reduce((sum, conversion) => sum + conversion.commissionAmount, 0)
            .toFixed(2),
        ),
        currency: DEFAULT_CURRENCY,
        status: queuedStatus,
        method: influencer.payoutMethod ?? "manual",
        reference:
          queuedStatus === "processing"
            ? "In coda per il prossimo payout run"
            : "In attesa del rilascio merchant",
        paidAt: null,
        createdAt: queuedCreatedAt,
      });

      queuedApprovedConversions.forEach((conversion) => {
        payoutAllocations.push({
          id: `payout_alloc_${queuedPayoutId}_${conversion.id}`,
          payoutId: queuedPayoutId,
          conversionId: conversion.id,
          influencerId: influencer.id,
          amount: conversion.commissionAmount,
          releasedAt: null,
          createdAt: queuedCreatedAt,
        });
      });
    }

    const availableCampaigns = campaigns.filter((campaign) =>
      campaignAppliesToAffiliate(campaign, influencer.id),
    );

    availableCampaigns.forEach((campaign, campaignIndex) => {
      if (!campaign.bonusType || !campaign.bonusTitle) {
        return;
      }

      rewards.push({
        id: `reward_${campaign.id}_${influencer.id}`,
        influencerId: influencer.id,
        campaignId: campaign.id,
        type: campaign.bonusType,
        title: campaign.bonusTitle,
        description: campaign.bonusDescription ?? campaign.bonusTitle,
        value: campaign.bonusValue,
        currency: DEFAULT_CURRENCY,
        status:
          campaignIndex === 0 && influencerIndex !== 2
            ? "earned"
            : campaign.status === "scheduled"
              ? "available"
              : "issued",
        issuedAt:
          campaignIndex === 0 && influencerIndex !== 2 ? null : isoDaysAgo(4 + influencerIndex),
        createdAt: campaign.createdAt,
      });
    });
  });

  suspiciousEvents.push(
    {
      id: "flag_self_referral_luna",
      influencerId: lunaInfluencer.id,
      referralLinkId: referralLinks.find((link) => link.code === "luna-voss")?.id ?? null,
      promoCodeId: promoCodes.find((promoCode) => promoCode.code === "LUNAVOSS10")?.id ?? null,
      conversionId: conversions.find((conversion) => conversion.customerEmail === luna.email)?.id ?? null,
      type: "self_referral",
      severity: "high",
      status: "open",
      title: "Possibile ordine in self-referral",
      detail: "L'email cliente coincide con quella dell'account affiliato su un ordine commissionabile.",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: isoDaysAgo(12, 14),
    },
    {
      id: "flag_repeated_ip_nico",
      influencerId: nicoInfluencer.id,
      referralLinkId:
        referralLinks.find((link) => link.code === "nico-hart-holiday")?.id ?? null,
      promoCodeId: null,
      conversionId: null,
      type: "repeated_ip",
      severity: "medium",
      status: "open",
      title: "Picco attivita da IP ripetuto",
      detail: "Sono stati registrati piu click dallo stesso IP in una finestra breve su un link campagna.",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: isoDaysAgo(1, 18),
    },
    {
      id: "flag_manual_maya",
      influencerId: mayaInfluencer.id,
      referralLinkId: null,
      promoCodeId: promoCodes.find((promoCode) => promoCode.code === "MAYA-GLOW")?.id ?? null,
      conversionId: null,
      type: "manual_review",
      severity: "low",
      status: "reviewed",
      title: "Richiesta revisione manuale",
      detail: "La richiesta del codice campagna e stata rivista e lasciata in attesa fino all'avvio della campagna.",
      reviewedBy: admin.id,
      reviewedAt: isoDaysAgo(1, 12),
      createdAt: isoDaysAgo(2, 11),
    },
  );

  const now = new Date().toISOString();
  const storeConnection: StoreConnection = {
    id: "store_connection_default",
    platform: "shopify",
    storeName: "Store demo Affinity",
    shopDomain: "affinity-demo.myshopify.com",
    storefrontUrl: createAbsoluteUrl("/shop"),
    defaultDestinationUrl: createAbsoluteUrl("/shop"),
    installState: "installed",
    status: "connected",
    connectionHealth: "warning",
    syncProductsEnabled: true,
    syncDiscountCodesEnabled: true,
    orderAttributionEnabled: true,
    autoCreateDiscountCodes: true,
    appEmbedEnabled: true,
    requiredScopes: [...SHOPIFY_SCOPE_VALUES],
    grantedScopes: [...SHOPIFY_SCOPE_VALUES],
    installedAt: isoDaysAgo(46, 9),
    connectedAt: isoDaysAgo(45, 10),
    lastHealthCheckAt: isoDaysAgo(0, 9),
    lastHealthError:
      "Un webhook ordine e in attesa di retry dopo un mismatch di attribuzione.",
    lastProductsSyncAt: isoDaysAgo(1, 9),
    lastDiscountSyncAt: isoDaysAgo(0, 8),
    lastOrdersSyncAt: isoDaysAgo(0, 7),
    lastWebhookAt: isoDaysAgo(0, 10),
    productsSyncedCount: storeCatalogItems.filter((item) => item.type === "product").length,
    collectionsSyncedCount: storeCatalogItems.filter((item) => item.type === "collection").length,
    discountsSyncedCount: promoCodes.filter((code) => code.status === "active").length,
    updatedAt: now,
  };

  const storeSyncJobs: StoreSyncJob[] = [
    {
      id: "sync_products_full_1",
      connectionId: storeConnection.id,
      type: "products",
      mode: "full",
      status: "succeeded",
      sourceOfTruth: "shopify",
      triggeredBy: "merchant",
      requestedBy: admin.id,
      parentJobId: null,
      notes: "Prima sincronizzazione completa del catalogo dopo l'installazione Shopify.",
      errorMessage: null,
      cursor: null,
      recordsProcessed: storeCatalogItems.filter((item) => item.type === "product").length,
      recordsCreated: storeCatalogItems.filter((item) => item.type === "product").length,
      recordsUpdated: 0,
      recordsFailed: 0,
      requestedAt: isoDaysAgo(1, 8),
      startedAt: isoDaysAgo(1, 8),
      completedAt: isoDaysAgo(1, 8),
      createdAt: isoDaysAgo(1, 8),
      updatedAt: isoDaysAgo(1, 8),
    },
    {
      id: "sync_discounts_incremental_1",
      connectionId: storeConnection.id,
      type: "discounts",
      mode: "incremental",
      status: "succeeded",
      sourceOfTruth: "hybrid",
      triggeredBy: "system",
      requestedBy: admin.id,
      parentJobId: null,
      notes: "Mantiene allineati i codici promo merchant con gli sconti Shopify.",
      errorMessage: null,
      cursor: "discounts:2026-03-13T08:00:00.000Z",
      recordsProcessed: promoCodes.length,
      recordsCreated: 0,
      recordsUpdated: promoCodes.filter((code) => code.status === "active").length,
      recordsFailed: 0,
      requestedAt: isoDaysAgo(0, 8),
      startedAt: isoDaysAgo(0, 8),
      completedAt: isoDaysAgo(0, 8),
      createdAt: isoDaysAgo(0, 8),
      updatedAt: isoDaysAgo(0, 8),
    },
    {
      id: "sync_orders_incremental_1",
      connectionId: storeConnection.id,
      type: "orders",
      mode: "incremental",
      status: "partial",
      sourceOfTruth: "shopify",
      triggeredBy: "webhook",
      requestedBy: null,
      parentJobId: null,
      notes: "Un ordine e stato processato, uno richiede un retry manuale.",
      errorMessage:
        "1 ordine non e stato attribuito perche la proprieta del coupon non combaciava con il referral link.",
      cursor: "orders:2026-03-13T07:00:00.000Z",
      recordsProcessed: 2,
      recordsCreated: 1,
      recordsUpdated: 0,
      recordsFailed: 1,
      requestedAt: isoDaysAgo(0, 7),
      startedAt: isoDaysAgo(0, 7),
      completedAt: isoDaysAgo(0, 7),
      createdAt: isoDaysAgo(0, 7),
      updatedAt: isoDaysAgo(0, 7),
    },
  ];

  const webhookIngestionRecords: WebhookIngestionRecord[] = [
    {
      id: "webhook_order_paid_ok_1",
      connectionId: storeConnection.id,
      topic: "orders/paid",
      shopDomain: storeConnection.shopDomain,
      externalEventId: "evt_shopify_order_paid_1001",
      status: "processed",
      attempts: 1,
      errorMessage: null,
      orderId: conversions[0]?.orderId ?? "SHOP-1001",
      referralCode: referralLinks[0]?.code ?? null,
      discountCode: promoCodes[0]?.code ?? null,
      influencerId: conversions[0]?.influencerId ?? null,
      campaignId: campaigns[0]?.id ?? null,
      conversionId: conversions[0]?.id ?? null,
      receivedAt: isoDaysAgo(0, 10),
      processedAt: isoDaysAgo(0, 10),
      payloadSummary: {
        orderAmount: conversions[0]?.orderAmount ?? 128,
        currency: DEFAULT_CURRENCY,
        attributionSource: "hybrid",
      },
      createdAt: isoDaysAgo(0, 10),
      updatedAt: isoDaysAgo(0, 10),
    },
    {
      id: "webhook_order_paid_failed_1",
      connectionId: storeConnection.id,
      topic: "orders/paid",
      shopDomain: storeConnection.shopDomain,
      externalEventId: "evt_shopify_order_paid_1002",
      status: "failed",
      attempts: 1,
      errorMessage: "Referral code e discount code puntano a due affiliati diversi.",
      orderId: "SHOP-1002",
      referralCode: referralLinks[1]?.code ?? null,
      discountCode: promoCodes[2]?.code ?? null,
      influencerId: null,
      campaignId: campaigns[1]?.id ?? null,
      conversionId: null,
      receivedAt: isoDaysAgo(0, 7),
      processedAt: null,
      payloadSummary: {
        orderAmount: 146,
        currency: DEFAULT_CURRENCY,
        attributionSource: "hybrid",
      },
      createdAt: isoDaysAgo(0, 7),
      updatedAt: isoDaysAgo(0, 7),
    },
    {
      id: "webhook_discount_update_1",
      connectionId: storeConnection.id,
      topic: "discounts/update",
      shopDomain: storeConnection.shopDomain,
      externalEventId: "evt_shopify_discount_update_1",
      status: "processed",
      attempts: 1,
      errorMessage: null,
      orderId: null,
      referralCode: null,
      discountCode: promoCodes[0]?.code ?? null,
      influencerId: promoCodes[0]?.influencerId ?? null,
      campaignId: promoCodes[0]?.campaignId ?? null,
      conversionId: null,
      receivedAt: isoDaysAgo(0, 8),
      processedAt: isoDaysAgo(0, 8),
      payloadSummary: {
        status: "updated",
        source: "shopify",
      },
      createdAt: isoDaysAgo(0, 8),
      updatedAt: isoDaysAgo(0, 8),
    },
  ];

  const db: DemoDatabase = {
    meta: {
      initializedAt: now,
      version: 7,
    },
    authAccounts: [
      {
        id: "demo_auth_admin",
        profileId: admin.id,
        email: admin.email,
        passwordHash: hashPassword(demoCredentials.admin.password),
      },
      {
        id: "demo_auth_luna",
        profileId: luna.id,
        email: luna.email,
        passwordHash: hashPassword(demoCredentials.influencer.password),
      },
      {
        id: "demo_auth_nico",
        profileId: nico.id,
        email: nico.email,
        passwordHash: hashPassword("Creator123!"),
      },
      {
        id: "demo_auth_maya",
        profileId: maya.id,
        email: maya.email,
        passwordHash: hashPassword("Creator123!"),
      },
      {
        id: "demo_auth_sophia",
        profileId: sophia.id,
        email: sophia.email,
        passwordHash: hashPassword(demoCredentials.pending.password),
      },
    ],
    profiles: [admin, luna, nico, maya, sophia],
    influencerApplications: [
      lunaApplication,
      nicoApplication,
      mayaApplication,
      sophiaApplication,
      carmenApplication,
    ],
    influencers,
    referralLinks,
    linkClicks,
    conversions,
    payouts,
    payoutAllocations,
    storeCatalogItems,
    storeSyncJobs,
    webhookIngestionRecords,
    promoAssets,
    influencerAssetAccess,
    promoCodes,
    campaigns,
    rewards,
    suspiciousEvents,
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
      emailReplyTo: "partners@affinity-demo.com",
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
      allowedDestinationUrls: destinationOptions.map((option) =>
        createAbsoluteUrl(option.value),
      ),
      createdAt: adminCreatedAt,
      updatedAt: now,
    },
    storeConnection,
    auditLogs: [
      {
        id: "audit_seed_1",
        actorProfileId: admin.id,
        entityType: "application",
        entityId: lunaApplication.id,
        action: "approved",
        payload: { status: "approved" },
        createdAt: lunaApplication.reviewedAt ?? lunaApplication.createdAt,
      },
      {
        id: "audit_seed_2",
        actorProfileId: admin.id,
        entityType: "promo_code",
        entityId: "code_maya_request",
        action: "requested",
        payload: { status: "pending" },
        createdAt: isoDaysAgo(2, 11),
      },
    ],
  };

  return db;
}

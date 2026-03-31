import { z } from "zod";

import { SHOPIFY_SCOPE_VALUES } from "@/lib/constants";
import {
  applicationStatuses,
  attributionSources,
  audienceSizes,
  campaignStatuses,
  commissionTypes,
  conversionStatuses,
  payoutMethods,
  payoutStatuses,
  primaryPlatforms,
  promoAssetTypes,
  promoCodeStatuses,
  rewardTypes,
  shopifyInstallStates,
  storeConnectionStatuses,
  storeSyncJobModes,
  storeSyncJobTypes,
  suspiciousEventSeverities,
  suspiciousEventStatuses,
  webhookTopics,
} from "@/lib/types";

const handleSchema = z
  .string()
  .trim()
  .min(2, "Inserisci un handle valido")
  .max(50, "L'handle deve restare sotto i 50 caratteri");

const promoCodeValueSchema = z
  .string()
  .trim()
  .min(4, "Il codice promo deve avere almeno 4 caratteri")
  .max(24, "Il codice promo deve restare sotto i 24 caratteri")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Sono consentiti solo lettere, numeri, trattini e underscore",
  );

export const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Inserisci nome e cognome").max(80),
  email: z.email("Inserisci un indirizzo email valido"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri").max(64),
  instagramHandle: handleSchema,
  tiktokHandle: z.string().trim().max(50).optional().or(z.literal("")),
  youtubeHandle: z.string().trim().max(50).optional().or(z.literal("")),
  primaryPlatform: z.enum(primaryPlatforms),
  audienceSize: z.enum(audienceSizes),
  country: z.string().trim().min(2, "Inserisci il Paese").max(80),
  niche: z.string().trim().min(2, "Inserisci la tua nicchia").max(80),
  message: z.string().trim().min(20, "Raccontaci qualcosa in piu").max(600),
  consentAccepted: z.boolean().refine((value) => value, {
    message: "Devi accettare termini e informativa privacy",
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Inserisci email o username"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export const affiliateRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Inserisci nome e cognome").max(80),
  email: z.email("Inserisci un indirizzo email valido"),
  country: z.string().trim().min(2, "Inserisci il Paese").max(80),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri").max(64),
  consentAccepted: z.boolean().refine((value) => value, {
    message: "Devi accettare termini e informativa privacy",
  }),
});

export const influencerSettingsSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  instagramHandle: handleSchema,
  tiktokHandle: z.string().trim().max(50).optional().or(z.literal("")),
  youtubeHandle: z.string().trim().max(50).optional().or(z.literal("")),
  payoutMethod: z.enum(payoutMethods),
  payoutEmail: z.email("Inserisci un'email valida per i payout"),
  companyName: z.string().trim().max(80).optional().or(z.literal("")),
  taxId: z.string().trim().max(64).optional().or(z.literal("")),
  notificationEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "Inserisci un'email valida per le notifiche",
    }),
  notificationsEnabled: z.boolean(),
});

export const applicationStatusFilterSchema = z
  .enum([...applicationStatuses, "all"] as const)
  .default("all");

export const adminInfluencerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.email("Inserisci un indirizzo email valido"),
  country: z.string().trim().min(2).max(80),
  isActive: z.boolean(),
  commissionType: z.enum(commissionTypes),
  commissionValue: z.coerce.number().positive().max(1000),
  payoutMethod: z.enum(payoutMethods),
  payoutEmail: z.email("Inserisci un'email valida per i payout"),
  notes: z.string().trim().max(400).optional().or(z.literal("")),
});

export const conversionSchema = z.object({
  influencerId: z.string().min(1, "Seleziona un affiliato"),
  referralLinkId: z.string().optional().nullable(),
  promoCodeId: z.string().optional().nullable(),
  orderId: z.string().trim().min(2, "Inserisci l'ID ordine").max(80),
  customerEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "Inserisci un'email cliente valida",
    }),
  orderAmount: z.coerce.number().positive("L'importo ordine deve essere positivo"),
  currency: z.enum(["USD", "EUR", "GBP"]),
  commissionType: z.enum(commissionTypes),
  commissionValue: z.coerce.number().positive().max(1000),
  attributionSource: z.enum(attributionSources).optional(),
  status: z.enum(conversionStatuses),
  createdAt: z.string().optional(),
});

export const payoutUpdateSchema = z.object({
  payoutId: z.string().min(1),
  status: z.enum(payoutStatuses),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
});

export const payoutBatchSchema = z.object({
  influencerId: z.string().min(1, "Seleziona un affiliato"),
  conversionIds: z
    .array(z.string().min(1))
    .min(1, "Seleziona almeno una commissione approvata"),
  method: z.enum(payoutMethods),
  status: z.enum(["draft", "pending", "processing", "paid"] as const),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
});

export const promoAssetSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(120),
  type: z.enum(promoAssetTypes),
  fileUrl: z.url("Inserisci un URL valido per l'asset"),
  description: z.string().trim().min(10).max(300),
  caption: z.string().trim().max(240).optional().or(z.literal("")),
  instructions: z.string().trim().max(300).optional().or(z.literal("")),
  campaignId: z.string().optional().nullable(),
  isActive: z.boolean(),
});

export const referralLinkSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Dai un nome chiaro al link per riconoscerlo subito")
    .max(60),
  destinationUrl: z.string().trim().min(1, "Aggiungi un URL di destinazione"),
  utmSource: z.string().trim().max(40).optional().or(z.literal("")),
  utmMedium: z.string().trim().max(40).optional().or(z.literal("")),
  utmCampaign: z.string().trim().max(60).optional().or(z.literal("")),
  campaignId: z.string().optional().nullable(),
});

export const referralLinkStatusSchema = z.object({
  linkId: z.string().min(1),
  isActive: z.boolean(),
});

export const promoCodeCreateSchema = z.object({
  action: z.enum(["generate", "request"]),
  desiredCode: z.string().trim().max(24).optional().or(z.literal("")),
  campaignId: z.string().optional().nullable(),
  requestMessage: z.string().trim().max(180).optional().or(z.literal("")),
});

export const adminPromoCodeSchema = z.object({
  influencerId: z.string().min(1, "Seleziona un affiliato"),
  code: promoCodeValueSchema.optional().or(z.literal("")),
  campaignId: z.string().optional().nullable(),
  discountValue: z.coerce.number().positive().max(90),
  isPrimary: z.boolean(),
});

export const promoCodeReviewSchema = z.object({
  promoCodeId: z.string().min(1),
  status: z.enum(["active", "rejected", "disabled"]),
  finalCode: z.string().trim().max(24).optional().or(z.literal("")),
});

export const campaignSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(400),
    landingUrl: z.string().trim().min(1, "Aggiungi una destinazione per la campagna"),
    startDate: z.string().min(1, "La data di inizio e obbligatoria"),
    endDate: z.string().min(1, "La data di fine e obbligatoria"),
    status: z.enum(campaignStatuses),
    commissionType: z.enum([...commissionTypes, "default"] as const),
    commissionValue: z.coerce.number().nullable().optional(),
    bonusTitle: z.string().trim().max(120).optional().or(z.literal("")),
    bonusDescription: z.string().trim().max(240).optional().or(z.literal("")),
    bonusType: z.enum(rewardTypes).nullable().optional(),
    bonusValue: z.coerce.number().nullable().optional(),
    appliesToAll: z.boolean(),
    affiliateIds: z.array(z.string()).default([]),
  })
  .refine(
    (value) =>
      value.commissionType === "default" ||
      (typeof value.commissionValue === "number" && value.commissionValue > 0),
    {
      message: "Inserisci il valore commissione se sovrascrivi il modello predefinito.",
      path: ["commissionValue"],
    },
  )
  .refine(
    (value) => value.appliesToAll || value.affiliateIds.length > 0,
    {
      message: "Seleziona almeno un affiliato oppure assegna la campagna a tutti.",
      path: ["affiliateIds"],
    },
  );

export const programSettingsSchema = z.object({
  allowAffiliateCodeGeneration: z.boolean(),
  allowPromoCodeRequests: z.boolean(),
  allowCustomLinkDestinations: z.boolean(),
  promoCodePrefix: z
    .string()
    .trim()
    .min(2, "Inserisci un prefisso breve")
    .max(8, "Mantieni il prefisso sotto gli 8 caratteri")
    .regex(/^[A-Za-z0-9]+$/, "Usa solo lettere e numeri"),
  emailBrandName: z.string().trim().min(2).max(80),
  emailReplyTo: z.email("Inserisci un'email reply-to valida"),
  antiLeakEnabled: z.boolean(),
  blockSelfReferrals: z.boolean(),
  requireCodeOwnershipMatch: z.boolean(),
  fraudReviewEnabled: z.boolean(),
  maxClicksPerIpPerDay: z.coerce.number().int().min(1).max(1000),
  maxConversionsPerIpPerDay: z.coerce.number().int().min(1).max(100),
  enableRewards: z.boolean(),
  enableStoreCredit: z.boolean(),
  enableMarketplace: z.boolean(),
  enableMultiLevel: z.boolean(),
  enableMultiProgram: z.boolean(),
  enableAutoPayouts: z.boolean(),
  allowedDestinationUrls: z
    .array(z.string().trim().url("Inserisci URL di destinazione validi"))
    .min(1, "Aggiungi almeno una destinazione consentita"),
});

export const storeConnectionSchema = z.object({
  storeName: z.string().trim().min(2, "Il nome store e obbligatorio").max(120),
  shopDomain: z
    .string()
    .trim()
    .min(3, "Il dominio shop e obbligatorio")
    .max(120)
    .regex(
      /^[a-z0-9.-]+$/,
      "Usa solo lettere minuscole, numeri, punti e trattini",
    ),
  storefrontUrl: z.url("Inserisci un URL storefront valido"),
  defaultDestinationUrl: z.url("Inserisci un URL di destinazione predefinito valido"),
  installState: z.enum(shopifyInstallStates),
  status: z.enum(storeConnectionStatuses),
  syncProductsEnabled: z.boolean(),
  syncDiscountCodesEnabled: z.boolean(),
  orderAttributionEnabled: z.boolean(),
  autoCreateDiscountCodes: z.boolean(),
  appEmbedEnabled: z.boolean(),
  grantedScopes: z.array(z.enum(SHOPIFY_SCOPE_VALUES)),
});

export const storeCatalogRulesSchema = z.object({
  defaultDestinationUrl: z.url("Seleziona una destinazione storefront predefinita valida"),
  enabledDestinationUrls: z
    .array(z.string().trim().url("Usa URL di destinazione storefront validi"))
    .min(1, "Abilita almeno una destinazione per gli affiliati"),
});

export const storeSyncJobSchema = z.object({
  type: z.enum(storeSyncJobTypes),
  mode: z.enum(storeSyncJobModes),
  notes: z.string().trim().max(200).optional().or(z.literal("")),
});

export const storeWebhookIngestionSchema = z.object({
  topic: z.enum(webhookTopics),
  orderId: z.string().trim().min(2, "Inserisci l'ID ordine").max(80),
  orderAmount: z.coerce.number().nonnegative().nullable().optional(),
  currency: z.enum(["USD", "EUR", "GBP"]),
  customerEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "Inserisci un'email cliente valida",
    }),
  referralCode: z.string().trim().max(80).optional().or(z.literal("")),
  discountCode: z.string().trim().max(80).optional().or(z.literal("")),
});

export const promoCodeStatusFilterSchema = z
  .enum([...promoCodeStatuses, "all"] as const)
  .default("all");

export const applicationApprovalSchema = z.object({
  reviewNotes: z.string().trim().max(300).optional().or(z.literal("")),
  commissionType: z.enum(commissionTypes),
  commissionValue: z.coerce.number().positive().max(1000),
  payoutMethod: z.enum(payoutMethods),
  campaignId: z.string().optional().nullable(),
});

export const applicationRejectionSchema = z.object({
  reviewNotes: z.string().trim().max(300).optional().or(z.literal("")),
});

export const suspiciousEventReviewSchema = z.object({
  suspiciousEventId: z.string().min(1),
  status: z.enum(suspiciousEventStatuses),
});

export const manualSuspiciousEventSchema = z.object({
  influencerId: z.string().min(1, "Seleziona un affiliato"),
  title: z.string().trim().min(3).max(120),
  detail: z.string().trim().min(8).max(300),
  severity: z.enum(suspiciousEventSeverities),
});

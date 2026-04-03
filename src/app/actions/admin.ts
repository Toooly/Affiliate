"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { sendTransactionalEmail } from "@/lib/email/sender";
import {
  affiliateInviteTemplate,
  applicationApprovedTemplate,
  applicationRejectedTemplate,
  welcomeTemplate,
} from "@/lib/email/templates";
import { isResendConfigured } from "@/lib/env";
import type { ActionResult } from "@/lib/types";
import {
  affiliateInviteSchema,
  adminInfluencerSchema,
  adminPromoCodeSchema,
  applicationApprovalSchema,
  applicationRejectionSchema,
  campaignSchema,
  conversionSchema,
  manualSuspiciousEventSchema,
  payoutBatchSchema,
  payoutUpdateSchema,
  programSettingsSchema,
  promoAssetSchema,
  promoCodeReviewSchema,
  referralLinkStatusSchema,
  storeCatalogRulesSchema,
  storeConnectionSchema,
  storeSyncJobSchema,
  storeWebhookIngestionSchema,
  suspiciousEventReviewSchema,
} from "@/lib/validations";
import { createAbsoluteUrl } from "@/lib/utils";

export async function approveApplicationAction(
  applicationId: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = applicationApprovalSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Rivedi i dati di approvazione.",
    };
  }

  try {
    const influencer = await getRepository().approveApplication(
      applicationId,
      session.profileId,
      parsed.data,
    );
    const [profile, overview] = await Promise.all([
      getRepository().getProfileById(influencer.profileId),
      getRepository().getAdminOverview(),
    ]);

    if (profile) {
      const approval = applicationApprovedTemplate(
        profile.fullName,
        influencer.discountCode,
        createAbsoluteUrl(`/r/${influencer.publicSlug}`),
        overview.programSettings.emailBrandName,
      );
      const welcome = welcomeTemplate(
        profile.fullName,
        overview.programSettings.emailBrandName,
      );

      await sendTransactionalEmail({
        to: profile.email,
        subject: approval.subject,
        html: approval.html.replaceAll('href="/', `href="${createAbsoluteUrl("/")}`),
        replyTo: overview.programSettings.emailReplyTo,
      });
      await sendTransactionalEmail({
        to: profile.email,
        subject: welcome.subject,
        html: welcome.html.replaceAll('href="/', `href="${createAbsoluteUrl("/")}`),
        replyTo: overview.programSettings.emailReplyTo,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/applications");
    revalidatePath("/admin/affiliates");
    revalidatePath("/admin/campaigns");

    return {
      ok: true,
      message: "Candidatura approvata e accesso creator generato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad approvare la candidatura.",
    };
  }
}

export async function createAffiliateInviteAction(
  input: unknown,
): Promise<ActionResult<string>> {
  const session = await requireAdmin();
  const parsed = affiliateInviteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati del link invito.",
    };
  }

  try {
    const invite = await getRepository().createAffiliateInvite(parsed.data, session.profileId);
    const [overview, campaigns] = await Promise.all([
      getRepository().getAdminOverview(),
      parsed.data.campaignId ? getRepository().listCampaigns() : Promise.resolve([]),
    ]);
    const linkedCampaign = parsed.data.campaignId
      ? campaigns.find((campaign) => campaign.id === parsed.data.campaignId) ?? null
      : null;

    if (parsed.data.invitedEmail?.trim()) {
      const template = affiliateInviteTemplate({
        registrationUrl: invite.registrationUrl,
        fullName: parsed.data.invitedName?.trim() || null,
        campaignName: linkedCampaign?.name ?? null,
        expiresAt: invite.expiresAt,
        brandName: overview.programSettings.emailBrandName,
      });

      await sendTransactionalEmail({
        to: parsed.data.invitedEmail.trim().toLowerCase(),
        subject: template.subject,
        html: template.html,
        replyTo: overview.programSettings.emailReplyTo,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/applications");

    return {
      ok: true,
      message: parsed.data.invitedEmail?.trim()
        ? isResendConfigured()
          ? "Invito affiliato generato e inviato via email."
          : "Link invito affiliato generato. Configura il sender email per inviarlo automaticamente."
        : "Link invito affiliato generato.",
      data: invite.registrationUrl,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Non siamo riusciti a generare il link invito affiliato.",
    };
  }
}

export async function rejectApplicationAction(
  applicationId: string,
  input?: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = applicationRejectionSchema.safeParse(input ?? {});

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Rivedi la nota di revisione.",
    };
  }

  try {
    const applications = await getRepository().listApplications("all");
    const application = applications.find((item) => item.id === applicationId);
    const overview = application ? await getRepository().getAdminOverview() : null;

    await getRepository().rejectApplication(
      applicationId,
      session.profileId,
      parsed.data.reviewNotes ?? null,
    );

    if (application) {
      const template = applicationRejectedTemplate(
        application.fullName,
        overview?.programSettings.emailBrandName,
      );
      await sendTransactionalEmail({
        to: application.email,
        subject: template.subject,
        html: template.html.replaceAll('href="/', `href="${createAbsoluteUrl("/")}`),
        replyTo: overview?.programSettings.emailReplyTo,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/applications");

    return {
      ok: true,
      message: "Candidatura rifiutata.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a rifiutare la candidatura.",
    };
  }
}

export async function updateInfluencerAdminAction(
  influencerId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = adminInfluencerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati dell'affiliato.",
    };
  }

  try {
    await getRepository().updateInfluencerAdmin(influencerId, parsed.data);
    revalidatePath("/admin");
    revalidatePath("/admin/affiliates");
    revalidatePath(`/admin/affiliates/${influencerId}`);

    return {
      ok: true,
      message: "Affiliato aggiornato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare l'affiliato.",
    };
  }
}

export async function createConversionAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = conversionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati della conversione.",
    };
  }

  try {
    await getRepository().createConversion(parsed.data, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/campaigns");
    revalidatePath("/admin/conversions");
    revalidatePath("/admin/payouts");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Conversione registrata.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a registrare la conversione.",
    };
  }
}

export async function reviewSuspiciousEventAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = suspiciousEventReviewSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Rivedi questo aggiornamento di stato.",
    };
  }

  try {
    await getRepository().reviewSuspiciousEvent(parsed.data, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/links");
    revalidatePath("/admin/affiliates");

    return {
      ok: true,
      message: "Flag sospetto aggiornato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare il flag.",
    };
  }
}

export async function createManualSuspiciousEventAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = manualSuspiciousEventSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Rivedi i dati del flag manuale.",
    };
  }

  try {
    await getRepository().createManualSuspiciousEvent(parsed.data, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/affiliates");

    return {
      ok: true,
      message: "Flag manuale creato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a creare il flag manuale.",
    };
  }
}

export async function updatePayoutAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = payoutUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati del payout.",
    };
  }

  try {
    await getRepository().updatePayout(parsed.data);
    revalidatePath("/admin/conversions");
    revalidatePath("/admin/payouts");
    revalidatePath(`/admin/payouts/${parsed.data.payoutId}`);
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Payout aggiornato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare il payout.",
    };
  }
}

export async function createPayoutBatchAction(
  input: unknown,
): Promise<ActionResult<string>> {
  const session = await requireAdmin();
  const parsed = payoutBatchSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati del batch payout.",
    };
  }

  try {
    const payout = await getRepository().createPayoutBatch(parsed.data, session.profileId);
    revalidatePath("/admin/conversions");
    revalidatePath("/admin/payouts");
    revalidatePath(`/admin/payouts/${payout.id}`);
    revalidatePath("/admin/affiliates");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: "Batch payout creato.",
      data: payout.id,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a creare il batch payout.",
    };
  }
}

export async function upsertPromoAssetAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = promoAssetSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati dell'asset.",
    };
  }

  try {
    await getRepository().upsertPromoAsset(parsed.data, session.profileId);
    revalidatePath("/admin/assets");
    revalidatePath("/admin/campaigns");
    if (parsed.data.campaignId) {
      revalidatePath(`/admin/campaigns/${parsed.data.campaignId}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assets");

    return {
      ok: true,
      message: "Asset promozionale salvato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a salvare l'asset.",
    };
  }
}

export async function updateReferralLinkStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = referralLinkStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla questa azione sul link.",
    };
  }

  try {
    await getRepository().updateReferralLinkStatus(parsed.data, session.profileId);
    revalidatePath("/admin/links");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");

    return {
      ok: true,
      message: parsed.data.isActive ? "Link referral attivato." : "Link referral disattivato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare il link referral.",
    };
  }
}

export async function assignPromoCodeAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = adminPromoCodeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati del codice promo.",
    };
  }

  try {
    await getRepository().assignPromoCode(
      {
        ...parsed.data,
        code: parsed.data.code ?? "",
      },
      session.profileId,
    );
    revalidatePath("/admin/codes");
    revalidatePath("/admin/campaigns");
    if (parsed.data.campaignId) {
      revalidatePath(`/admin/campaigns/${parsed.data.campaignId}`);
    }
    revalidatePath("/admin/affiliates");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/codes");

    return {
      ok: true,
      message: "Codice promo assegnato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad assegnare il codice promo.",
    };
  }
}

export async function reviewPromoCodeAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = promoCodeReviewSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla la richiesta del codice promo.",
    };
  }

  try {
    await getRepository().reviewPromoCode(parsed.data, session.profileId);
    revalidatePath("/admin/codes");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/codes");

    return {
      ok: true,
      message:
        parsed.data.status === "active"
          ? "Codice promo approvato."
          : parsed.data.status === "rejected"
            ? "Richiesta codice promo rifiutata."
            : "Codice promo disattivato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare il codice promo.",
    };
  }
}

export async function createCampaignAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = campaignSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati della campagna.",
    };
  }

  try {
    await getRepository().createCampaign(parsed.data, session.profileId);
    revalidatePath("/admin/campaigns");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/campaigns");

    return {
      ok: true,
      message: "Campagna creata.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a creare la campagna.",
    };
  }
}

export async function updateCampaignAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = campaignSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati della campagna.",
    };
  }

  try {
    await getRepository().updateCampaign(parsed.data, session.profileId);
    revalidatePath("/admin/campaigns");
    if (parsed.data.id) {
      revalidatePath(`/admin/campaigns/${parsed.data.id}`);
    }
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/campaigns");

    return {
      ok: true,
      message: "Campagna aggiornata.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare la campagna.",
    };
  }
}

export async function updateStoreConnectionAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = storeConnectionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati della connessione store.",
    };
  }

  try {
    await getRepository().updateStoreConnection(parsed.data, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/store");
    revalidatePath("/admin/links");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");

    return {
      ok: true,
      message: "Connessione store aggiornata.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare la connessione store.",
    };
  }
}

export async function updateStoreCatalogRulesAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = storeCatalogRulesSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla le regole delle destinazioni store.",
    };
  }

  try {
    await getRepository().updateStoreCatalogRules(parsed.data, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/store");
    revalidatePath("/admin/links");
    revalidatePath("/admin/campaigns");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");

    return {
      ok: true,
      message: "Regole destinazioni store aggiornate.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare le regole delle destinazioni store.",
    };
  }
}

export async function triggerStoreSyncAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = storeSyncJobSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati del job di sincronizzazione.",
    };
  }

  try {
    const job = await getRepository().triggerStoreSync(parsed.data, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/store");
    revalidatePath("/admin/campaigns");
    revalidatePath("/admin/links");
    revalidatePath("/admin/codes");

    if (job.status === "failed") {
      return {
        ok: false,
        message: job.errorMessage ?? "Sincronizzazione Shopify non riuscita.",
      };
    }

    return {
      ok: true,
      message:
        job.status === "partial"
          ? job.errorMessage ?? "Sincronizzazione Shopify completata con risultati parziali."
          : "Job di sincronizzazione Shopify completato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad avviare la sincronizzazione Shopify.",
    };
  }
}

export async function retryStoreSyncJobAction(jobId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  try {
    const job = await getRepository().retryStoreSyncJob(jobId, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/store");

    if (job.status === "failed") {
      return {
        ok: false,
        message: job.errorMessage ?? "Nuovo tentativo di sync Shopify non riuscito.",
      };
    }

    return {
      ok: true,
      message:
        job.status === "partial"
          ? job.errorMessage ?? "Nuovo tentativo di sync Shopify completato con risultati parziali."
          : "Nuovo tentativo di sync Shopify completato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a rilanciare il job di sync.",
    };
  }
}

export async function ingestStoreWebhookAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = storeWebhookIngestionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati di acquisizione del webhook.",
    };
  }

  try {
    const record = await getRepository().ingestStoreWebhook(parsed.data, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/store");
    revalidatePath("/admin/conversions");
    revalidatePath("/admin/links");
    revalidatePath("/admin/codes");
    revalidatePath("/admin/payouts");

    if (record.status === "failed") {
      return {
        ok: false,
        message: record.errorMessage ?? "Acquisizione evento store non riuscita.",
      };
    }

    return {
      ok: true,
      message:
        record.status === "processed"
          ? "Evento store acquisito e processato."
          : "Evento store acquisito e messo in coda.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad acquisire l'evento store.",
    };
  }
}

export async function retryWebhookIngestionAction(
  recordId: string,
): Promise<ActionResult> {
  const session = await requireAdmin();

  try {
    await getRepository().retryWebhookIngestion(recordId, session.profileId);
    revalidatePath("/admin");
    revalidatePath("/admin/store");
    revalidatePath("/admin/conversions");

    return {
      ok: true,
      message: "Elaborazione webhook rilanciata.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a rilanciare l'evento webhook.",
    };
  }
}

export async function updateProgramSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = programSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla le impostazioni del programma.",
    };
  }

  try {
    await getRepository().updateProgramSettings(parsed.data, session.profileId);
    revalidatePath("/admin/codes");
    revalidatePath("/admin/store");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/codes");

    return {
      ok: true,
      message: "Impostazioni programma aggiornate.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare le impostazioni del programma.",
    };
  }
}

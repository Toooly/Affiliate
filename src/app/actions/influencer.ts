"use server";

import { revalidatePath } from "next/cache";

import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import type { ActionResult } from "@/lib/types";
import {
  influencerSettingsSchema,
  promoCodeCreateSchema,
  referralLinkSchema,
} from "@/lib/validations";

export async function updateInfluencerSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireInfluencer();
  const parsed = influencerSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i campi evidenziati.",
    };
  }

  try {
    await getRepository().updateInfluencerSettings(session.profileId, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/earnings");
    revalidatePath("/dashboard/settings");

    return {
      ok: true,
      message: "Le impostazioni sono state aggiornate.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad aggiornare le impostazioni.",
    };
  }
}

export async function createReferralLinkAction(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireInfluencer();
  const parsed = referralLinkSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati del link.",
    };
  }

  try {
    await getRepository().createReferralLink(session.profileId, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");

    return {
      ok: true,
      message: "Link referral creato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a creare il link referral.",
    };
  }
}

export async function archiveReferralLinkAction(
  linkId: string,
): Promise<ActionResult> {
  const session = await requireInfluencer();

  try {
    await getRepository().archiveReferralLink(session.profileId, linkId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");

    return {
      ok: true,
      message: "Link archiviato.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti ad archiviare il link.",
    };
  }
}

export async function createPromoCodeAction(input: unknown): Promise<ActionResult> {
  const session = await requireInfluencer();
  const parsed = promoCodeCreateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i dati della richiesta codice promo.",
    };
  }

  try {
    await getRepository().createPromoCodeForInfluencer(session.profileId, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/codes");
    revalidatePath("/dashboard/earnings");

    return {
      ok: true,
      message:
        parsed.data.action === "generate"
          ? "Codice promo generato."
          : "Richiesta codice promo inviata.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Non siamo riusciti a completare questa operazione sul codice promo.",
    };
  }
}

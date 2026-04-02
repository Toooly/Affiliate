"use server";

import { revalidatePath } from "next/cache";

import { loginAction, sendApplicationReceiptEmail } from "@/app/actions/auth";
import { getRepository } from "@/lib/data/repository";
import type {
  ActionResult,
  AffiliateRegistrationInput,
  ApplicationInput,
} from "@/lib/types";
import {
  affiliateRegistrationSchema,
  applicationSchema,
} from "@/lib/validations";

function buildApplicationInputFromRegistration(
  input: AffiliateRegistrationInput,
): ApplicationInput {
  const emailLocalPart =
    input.email
      .trim()
      .toLowerCase()
      .split("@")[0]
      ?.replace(/[^a-z0-9._-]/g, "")
      .slice(0, 30) || "";
  const fallbackHandle =
    emailLocalPart.length >= 2 ? emailLocalPart : `creator${Date.now().toString().slice(-6)}`;

  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    country: input.country.trim(),
    instagramHandle: fallbackHandle,
    tiktokHandle: "",
    youtubeHandle: "",
    primaryPlatform: "multi-platform",
    audienceSize: "0-1k",
    niche: "Creator partnership",
    message: input.inviteToken
      ? "Registrazione completata da invito merchant. Account affiliato creato con accesso immediato."
      : "Registrazione inviata dal portale pubblico. Profilo in attesa di revisione.",
    consentAccepted: input.consentAccepted,
    inviteToken: input.inviteToken,
  };
}

export async function submitApplicationAction(input: unknown): Promise<ActionResult> {
  const parsed = applicationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i campi del modulo.",
    };
  }

  try {
    const application = await getRepository().createApplication(parsed.data);
    await sendApplicationReceiptEmail(application.email, application.fullName);
    revalidatePath("/admin/applications");

    return {
      ok: true,
      message: "Candidatura ricevuta. Controlla la tua email per la conferma.",
      redirectTo: "/login/affiliate?application=received",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Non siamo riusciti a inviare la candidatura.",
    };
  }
}

export async function registerAffiliateAction(input: unknown): Promise<ActionResult> {
  const parsed = affiliateRegistrationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla i campi del modulo.",
    };
  }

  const applicationInput = buildApplicationInputFromRegistration(parsed.data);

  try {
    const application = await getRepository().createApplication(applicationInput);
    await sendApplicationReceiptEmail(
      application.email,
      application.fullName,
      application.status === "approved" ? "invite_activation" : "application",
    );
    revalidatePath("/admin");
    revalidatePath("/admin/applications");
    revalidatePath("/dashboard");

    const loginResult = await loginAction({
      email: parsed.data.email,
      password: parsed.data.password,
      workspace: "affiliate",
    });

    if (loginResult.ok) {
      return {
        ok: true,
        message: application.status === "approved"
          ? "Registrazione completata. Il portale affiliato e gia attivo."
          : "Registrazione completata. Il profilo e in revisione.",
        redirectTo:
          loginResult.redirectTo ??
          (application.status === "approved" ? "/dashboard" : "/application/pending"),
      };
    }

    return {
      ok: true,
      message:
        application.status === "approved"
          ? "Registrazione completata. Accedi per aprire il portale affiliato."
          : "Registrazione completata. Accedi per controllare lo stato del profilo.",
      redirectTo:
        application.status === "approved"
          ? "/login/affiliate"
          : "/login/affiliate?application=received",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Non siamo riusciti a completare la registrazione.",
    };
  }
}

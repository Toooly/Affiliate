"use server";

import { revalidatePath } from "next/cache";

import { sendApplicationReceiptEmail } from "@/app/actions/auth";
import { getRepository } from "@/lib/data/repository";
import type { ActionResult } from "@/lib/types";
import { applicationSchema } from "@/lib/validations";

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

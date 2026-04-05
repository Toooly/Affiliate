"use server";

import { redirect } from "next/navigation";

import {
  applicationReceivedTemplate,
  inviteActivatedTemplate,
} from "@/lib/email/templates";
import { getAffiliateAccessState, getPostLoginPath } from "@/lib/auth/access";
import { hasBackofficeAccess } from "@/lib/auth/roles";
import {
  type LoginWorkspace,
  getWorkspaceError,
} from "@/lib/auth/workspaces";
import { clearCurrentSession, createDemoSession, getCurrentSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { env, isDemoMode } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { loginSchema } from "@/lib/validations";

function translateAuthErrorMessage(message: string) {
  const normalized = message.trim();

  switch (normalized) {
    case "Invalid login credentials":
      return "Credenziali non valide.";
    case "Email not confirmed":
      return "Conferma l'indirizzo email prima di accedere.";
    case "User not found":
      return "Non troviamo un account associato a queste credenziali.";
    default:
      break;
  }

  if (/too many requests/i.test(normalized)) {
    return "Troppi tentativi di accesso. Riprova tra qualche minuto.";
  }

  return normalized;
}

async function resolveSupabaseLoginEmail(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  if (normalized.includes("@")) {
    return normalized;
  }

  const admin = createSupabaseAdminClient();
  const { data: influencerRow } = await admin
    .from("influencers")
    .select("profile_id")
    .eq("public_slug", normalized)
    .maybeSingle();

  if (influencerRow?.profile_id) {
    const { data: profileRow } = await admin
      .from("profiles")
      .select("email")
      .eq("id", influencerRow.profile_id)
      .maybeSingle();

    if (profileRow?.email) {
      return String(profileRow.email).toLowerCase();
    }
  }

  const { data: profileByLocalPart } = await admin
    .from("profiles")
    .select("email")
    .ilike("email", `${normalized}@%`)
    .limit(1)
    .maybeSingle();

  return profileByLocalPart?.email
    ? String(profileByLocalPart.email).toLowerCase()
    : normalized;
}

export async function loginAction(input: {
  email: string;
  password: string;
  workspace?: LoginWorkspace;
}): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Controlla le credenziali e riprova.",
    };
  }

  if (isDemoMode()) {
    const session = await getRepository().authenticateWithPassword(parsed.data);

    if (!session) {
      return {
        ok: false,
        message: "Non troviamo un account associato a queste credenziali.",
      };
    }

    const workspaceError = getWorkspaceError(session.role, input.workspace);

    if (workspaceError) {
      return {
        ok: false,
        message: workspaceError,
      };
    }

    await createDemoSession(session);

    if (hasBackofficeAccess(session.role)) {
      return {
        ok: true,
        message: "Bentornato.",
        redirectTo: getPostLoginPath(session.role, {
          applicationStatus: null,
          isActive: null,
        }),
      };
    }

    const accessState = await getAffiliateAccessState(session.profileId);

    return {
      ok: true,
      message: "Bentornato.",
      redirectTo: getPostLoginPath(session.role, accessState),
    };
  }

  const supabase = await createSupabaseServerClient();
  const resolvedEmail = await resolveSupabaseLoginEmail(parsed.data.email);
  const { error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: translateAuthErrorMessage(error.message) };
  }

  const session = await getCurrentSession();

  if (!session) {
    return {
      ok: false,
      message: "L'account esiste, ma il profilo non è ancora disponibile.",
    };
  }

  const workspaceError = getWorkspaceError(session.role, input.workspace);

  if (workspaceError) {
    await clearCurrentSession();
    return {
      ok: false,
      message: workspaceError,
    };
  }

  if (hasBackofficeAccess(session.role)) {
    return {
      ok: true,
      message: "Bentornato.",
      redirectTo: getPostLoginPath(session.role, {
        applicationStatus: null,
        isActive: null,
      }),
    };
  }

  const accessState = await getAffiliateAccessState(session.profileId);

  return {
    ok: true,
    message: "Bentornato.",
    redirectTo: getPostLoginPath(session.role, accessState),
  };
}

export async function logoutAction() {
  const session = await getCurrentSession();
  await clearCurrentSession();
  redirect(
    session ? (hasBackofficeAccess(session.role) ? "/login/admin" : "/login/affiliate") : "/login",
  );
}

export async function sendApplicationReceiptEmail(
  email: string,
  fullName: string,
  mode: "application" | "invite_activation" = "application",
) {
  const template =
    mode === "invite_activation"
      ? inviteActivatedTemplate(fullName)
      : applicationReceivedTemplate(fullName);

  if (env.appUrl) {
    template.html = template.html.replaceAll('href="/', `href="${env.appUrl}/`);
  }

  const { sendTransactionalEmail } = await import("@/lib/email/sender");
  return sendTransactionalEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

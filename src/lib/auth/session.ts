import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isDemoMode } from "@/lib/env";
import { hasBackofficeAccess } from "@/lib/auth/roles";
import { getPostLoginRedirect } from "@/lib/auth/workspaces";
import { getRepository } from "@/lib/data/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserSession } from "@/lib/types";

const DEMO_SESSION_COOKIE = "affinity_demo_session";

function encodeDemoSession(session: UserSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeDemoSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as UserSession;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const encoded = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
    const parsed = decodeDemoSession(encoded);

    if (!parsed) {
      return null;
    }

    const profile = await getRepository().getProfileById(parsed.profileId);

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
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await getRepository().getProfileByAuthUserId(user.id);

  if (!profile) {
    return null;
  }

  return {
    profileId: profile.id,
    role: profile.role,
    email: profile.email,
    fullName: profile.fullName,
    authUserId: user.id,
  } satisfies UserSession;
}

export async function createDemoSession(session: UserSession) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, encodeDemoSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();

  if (isDemoMode()) {
    cookieStore.delete(DEMO_SESSION_COOKIE);
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function requireAuthenticated(loginPath = "/login") {
  const session = await getCurrentSession();

  if (!session) {
    redirect(loginPath);
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuthenticated("/login/admin");

  if (!hasBackofficeAccess(session.role)) {
    const applicationStatus = await getRepository().getApplicationStatusForProfile(
      session.profileId,
    );
    redirect(getPostLoginRedirect(session.role, applicationStatus));
  }

  return session;
}

export async function requireInfluencer() {
  const session = await requireAuthenticated("/login/affiliate");
  const applicationStatus = await getRepository().getApplicationStatusForProfile(
    session.profileId,
  );

  if (hasBackofficeAccess(session.role)) {
    redirect("/admin");
  }

  if (applicationStatus !== "approved") {
    redirect("/application/pending");
  }

  return session;
}

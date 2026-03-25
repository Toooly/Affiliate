import { NextResponse, type NextRequest } from "next/server";

import { hasBackofficeAccess } from "@/lib/auth/roles";
import { getProtectedLoginPath } from "@/lib/auth/workspaces";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const demoCookieName = "affinity_demo_session";

function parseDemoSession(request: NextRequest) {
  const value = request.cookies.get(demoCookieName)?.value;

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as {
      role: "ADMIN" | "INFLUENCER" | "MANAGER";
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  const needsAdmin = pathname.startsWith("/admin");
  const needsAuth =
    needsAdmin ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/application/pending");

  if (!needsAuth) {
    if (!isDemoMode() && isSupabaseConfigured()) {
      await updateSupabaseSession(request, response);
    }

    return response;
  }

  if (isDemoMode()) {
    const session = parseDemoSession(request);

    if (!session) {
      const loginUrl = new URL(getProtectedLoginPath(pathname), request.url);
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (needsAdmin && !hasBackofficeAccess(session.role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!needsAdmin && hasBackofficeAccess(session.role)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return response;
  }

  if (isSupabaseConfigured()) {
    await updateSupabaseSession(request, response);
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/application/pending"],
};

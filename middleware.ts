import { NextResponse, type NextRequest } from "next/server";

import { getProtectedLoginPath } from "@/lib/auth/workspaces";
import { isDemoMode } from "@/lib/env";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  const needsAdmin = pathname.startsWith("/admin");
  const needsAuth =
    needsAdmin ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/application/pending") ||
    pathname.startsWith("/application/inactive");

  if (!needsAuth) {
    if (!isDemoMode()) {
      await updateSupabaseSession(request, response);
    }

    return response;
  }

  const loginUrl = new URL(getProtectedLoginPath(pathname), request.url);
  loginUrl.searchParams.set(
    "redirectTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  if (isDemoMode()) {
    const demoSession = request.cookies.get("affinity_demo_session")?.value;

    if (!demoSession) {
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  const {
    data: { user },
  } = await updateSupabaseSession(request, response);

  if (!user) {
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/application/pending",
    "/application/inactive",
  ],
};

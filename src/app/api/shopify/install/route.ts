import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { hasBackofficeAccess } from "@/lib/auth/roles";
import { getCurrentSession } from "@/lib/auth/session";
import {
  assertShopifyBridgeConfigured,
  buildShopifyInstallUrl,
  getShopifyStateCookieName,
  isValidShopifyShopDomain,
  normalizeShopifyShopDomain,
} from "@/lib/shopify-bridge";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session || !hasBackofficeAccess(session.role)) {
    const loginUrl = new URL("/login/admin", request.url);
    loginUrl.searchParams.set("next", "/admin/store");
    return NextResponse.redirect(loginUrl);
  }

  const shop = request.nextUrl.searchParams.get("shop") ?? "";

  if (!isValidShopifyShopDomain(shop)) {
    return NextResponse.redirect(new URL("/admin/store?shopify=invalid_shop", request.url));
  }

  try {
    assertShopifyBridgeConfigured();
  } catch {
    return NextResponse.redirect(
      new URL("/admin/store?shopify=bridge_not_configured", request.url),
    );
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(
    getShopifyStateCookieName(),
    JSON.stringify({
      state,
      profileId: session.profileId,
      shop: normalizeShopifyShopDomain(shop),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    },
  );

  return NextResponse.redirect(buildShopifyInstallUrl(shop, state));
}

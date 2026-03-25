import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  assertShopifyBridgeConfigured,
  exchangeShopifyCodeForToken,
  getShopifyStateCookieName,
  isValidShopifyShopDomain,
  normalizeShopifyShopDomain,
  runLiveStoreSync,
  upsertStoreConnectionFromOAuth,
  verifyShopifyCallbackHmac,
} from "@/lib/shopify-bridge";

type ShopifyStateCookie = {
  state: string;
  profileId: string | null;
  shop: string;
};

function parseStateCookie(value: string | undefined): ShopifyStateCookie | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as ShopifyStateCookie;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get("shop") ?? "";
  const code = searchParams.get("code") ?? "";
  const state = searchParams.get("state") ?? "";
  const cookieStore = await cookies();
  const storedState = parseStateCookie(
    cookieStore.get(getShopifyStateCookieName())?.value,
  );

  cookieStore.delete(getShopifyStateCookieName());

  if (!isValidShopifyShopDomain(shop) || !code || !state) {
    return NextResponse.redirect(new URL("/admin/store?shopify=invalid_callback", request.url));
  }

  if (!storedState || storedState.state !== state) {
    return NextResponse.redirect(new URL("/admin/store?shopify=invalid_state", request.url));
  }

  try {
    assertShopifyBridgeConfigured();
  } catch {
    return NextResponse.redirect(
      new URL("/admin/store?shopify=bridge_not_configured", request.url),
    );
  }

  if (!verifyShopifyCallbackHmac(searchParams)) {
    return NextResponse.redirect(new URL("/admin/store?shopify=invalid_hmac", request.url));
  }

  try {
    const token = await exchangeShopifyCodeForToken(shop, code);
    const connection = await upsertStoreConnectionFromOAuth({
      ownerProfileId: storedState.profileId,
      shopDomain: normalizeShopifyShopDomain(shop),
      accessToken: token.accessToken,
      grantedScopes: token.grantedScopes,
    });

    if (storedState.profileId) {
      await runLiveStoreSync(
        {
          type: "products",
          mode: "full",
          notes: "Initial Shopify catalog sync after OAuth callback.",
        },
        storedState.profileId,
        connection.id,
      );
    }

    return NextResponse.redirect(new URL("/admin/store?shopify=connected", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/admin/store?shopify=connected_with_sync_issue", request.url),
    );
  }
}

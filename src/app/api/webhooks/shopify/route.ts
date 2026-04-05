import { NextRequest, NextResponse } from "next/server";

import {
  assertShopifyBridgeConfigured,
  isValidShopifyShopDomain,
  normalizeShopifyShopDomain,
  persistIncomingWebhook,
  verifyShopifyWebhookHmac,
} from "@/lib/shopify-bridge";

export async function POST(request: NextRequest) {
  const topic = request.headers.get("x-shopify-topic");
  const shopDomain = request.headers.get("x-shopify-shop-domain");
  const webhookId = request.headers.get("x-shopify-webhook-id");
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");

  if (!topic || !shopDomain || !isValidShopifyShopDomain(shopDomain)) {
    return NextResponse.json({ error: "Header webhook Shopify non validi." }, { status: 400 });
  }

  try {
    assertShopifyBridgeConfigured();
  } catch {
    return NextResponse.json(
      { error: "L'ambiente del bridge Shopify non è configurato." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const hmacValid = verifyShopifyWebhookHmac(rawBody, hmacHeader);

  await persistIncomingWebhook({
    topic,
    shopDomain: normalizeShopifyShopDomain(shopDomain),
    webhookId,
    rawBody,
    hmacValid,
  });

  if (!hmacValid) {
    return NextResponse.json({ error: "Firma webhook Shopify non valida." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

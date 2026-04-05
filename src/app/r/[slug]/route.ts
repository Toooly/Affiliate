import { type NextRequest, NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";
import {
  buildStorefrontShareUrl,
  isOperationalStoreConnection,
  toStorefrontDestinationUrl,
} from "@/lib/storefront";
import { hashIp } from "@/lib/utils";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const utmSource = request.nextUrl.searchParams.get("utm_source");
  const utmMedium = request.nextUrl.searchParams.get("utm_medium");
  const utmCampaign = request.nextUrl.searchParams.get("utm_campaign");
  const repository = getRepository();
  const tracked = await repository.trackReferralClick({
    slug,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    ipHash: hashIp(forwardedFor?.split(",")[0]?.trim() ?? null),
    utmSource,
    utmMedium,
    utmCampaign,
  });
  const storeConnection = await repository.getStoreConnection();
  const destination = tracked
    ? buildStorefrontShareUrl({
        referralCode: tracked.referralCode,
        destinationUrl: tracked.destinationUrl,
        storefrontUrl: storeConnection.storefrontUrl,
        promoCode: isOperationalStoreConnection(storeConnection) ? tracked.promoCode : null,
      })
    : toStorefrontDestinationUrl("/shop", storeConnection.storefrontUrl);

  const destinationUrl = new URL(destination, request.url);

  const response = NextResponse.redirect(destinationUrl);
  response.cookies.set("affinity_ref", slug, {
    httpOnly: false,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

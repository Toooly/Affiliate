import { type NextRequest, NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";
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

  const destination =
    (await getRepository().trackReferralClick({
      slug,
      referrer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      ipHash: hashIp(forwardedFor?.split(",")[0]?.trim() ?? null),
      utmSource,
      utmMedium,
      utmCampaign,
    })) ?? `/shop?ref=${slug}`;

  return NextResponse.redirect(new URL(destination, request.url));
}

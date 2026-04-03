import { type NextRequest, NextResponse } from "next/server";

import { getRepository } from "@/lib/data/repository";
import { hashIp } from "@/lib/utils";

function createCorsResponse(status = 204) {
  return new NextResponse(null, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

export async function OPTIONS() {
  return createCorsResponse();
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();

  if (!slug) {
    return createCorsResponse();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  await getRepository().trackReferralClick({
    slug,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    ipHash: hashIp(forwardedFor?.split(",")[0]?.trim() ?? null),
    utmSource: request.nextUrl.searchParams.get("utm_source"),
    utmMedium: request.nextUrl.searchParams.get("utm_medium"),
    utmCampaign: request.nextUrl.searchParams.get("utm_campaign"),
  });

  return createCorsResponse();
}

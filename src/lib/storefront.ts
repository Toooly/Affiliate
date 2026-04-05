import { env } from "@/lib/env";
import type {
  PromoCode,
  PromoCodeListItem,
  ReferralLink,
  ReferralLinkListItem,
  StoreConnection,
} from "@/lib/types";

const DEFAULT_STOREFRONT_URL = "https://elevianutrition.eu";
const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

type PromoCodeCandidate = Pick<
  PromoCode | PromoCodeListItem,
  "code" | "status" | "isPrimary" | "campaignId" | "createdAt"
>;

type ReferralLinkCandidate = Pick<
  ReferralLink | ReferralLinkListItem,
  "code" | "destinationUrl" | "campaignId"
>;

function isLocalDevHostname(hostname: string) {
  return LOCAL_DEV_HOSTNAMES.has(hostname);
}

function getAppOrigin() {
  return new URL(env.appUrl).origin;
}

function normalizeDestinationInput(value: string) {
  try {
    const target = new URL(value, env.appUrl);
    const appUrl = new URL(env.appUrl);

    if (isLocalDevHostname(target.hostname) && target.origin !== appUrl.origin) {
      return new URL(
        `${target.pathname}${target.search}${target.hash}`,
        appUrl,
      ).toString();
    }

    return target.toString();
  } catch {
    return value;
  }
}

function normalizeStorefrontRoot(url: URL) {
  url.search = "";
  url.hash = "";

  if (url.pathname === "/shop") {
    url.pathname = "/";
  } else if (!url.pathname.endsWith("/")) {
    url.pathname = url.pathname === "/" ? "/" : `${url.pathname}/`;
  }

  return url;
}

function mapProgramPathToStorefrontPath(pathname: string) {
  return pathname === "/shop" ? "/" : pathname;
}

function mapStorefrontPathToProgramPath(pathname: string) {
  return pathname === "/" ? "/shop" : pathname;
}

export function getConfiguredStorefrontUrl(preferred?: string | null) {
  const fallback = env.storefrontUrl || DEFAULT_STOREFRONT_URL;
  const candidate = preferred?.trim() || fallback;

  try {
    const parsed = new URL(normalizeDestinationInput(candidate), fallback);

    if (
      parsed.origin === getAppOrigin() ||
      isLocalDevHostname(parsed.hostname)
    ) {
      return normalizeStorefrontRoot(new URL(fallback)).toString();
    }

    return normalizeStorefrontRoot(parsed).toString();
  } catch {
    return normalizeStorefrontRoot(new URL(fallback)).toString();
  }
}

export function getStorefrontHostLabel(
  storefrontUrl?: string | null,
  fallback = "elevianutrition.eu",
) {
  try {
    return new URL(getConfiguredStorefrontUrl(storefrontUrl)).host || fallback;
  } catch {
    return fallback;
  }
}

export function toStorefrontDestinationUrl(
  destinationUrl: string,
  storefrontUrl?: string | null,
) {
  const storefrontBase = new URL(getConfiguredStorefrontUrl(storefrontUrl));
  const storefrontOrigin = storefrontBase.origin;

  try {
    const target = new URL(normalizeDestinationInput(destinationUrl), env.appUrl);

    if (
      target.origin === getAppOrigin() ||
      isLocalDevHostname(target.hostname)
    ) {
      const mapped = new URL(
        mapProgramPathToStorefrontPath(target.pathname),
        storefrontBase,
      );

      mapped.search = target.search;
      mapped.hash = target.hash;

      return mapped.toString();
    }

    if (target.origin === storefrontOrigin && target.pathname === "/shop") {
      target.pathname = "/";
    }

    return target.toString();
  } catch {
    return getConfiguredStorefrontUrl(storefrontUrl);
  }
}

export function canonicalizeProgramDestinationUrl(
  destinationUrl: string,
  storefrontUrl?: string | null,
) {
  const storefrontOrigin = new URL(getConfiguredStorefrontUrl(storefrontUrl)).origin;

  try {
    const target = new URL(normalizeDestinationInput(destinationUrl), env.appUrl);

    if (
      target.origin === getAppOrigin() ||
      isLocalDevHostname(target.hostname)
    ) {
      return new URL(
        `${target.pathname}${target.search}${target.hash}`,
        env.appUrl,
      ).toString();
    }

    if (target.origin === storefrontOrigin) {
      return new URL(
        `${mapStorefrontPathToProgramPath(target.pathname)}${target.search}${target.hash}`,
        env.appUrl,
      ).toString();
    }

    return target.toString();
  } catch {
    return destinationUrl;
  }
}

export function getProgramShareDestinationOptions(
  destinations: string[],
  storefrontUrl?: string | null,
) {
  const normalized = Array.from(
    new Set(
      destinations
        .map((destination) =>
          toStorefrontDestinationUrl(destination, storefrontUrl),
        )
        .filter(Boolean),
    ),
  );

  return normalized.length
    ? normalized
    : [getConfiguredStorefrontUrl(storefrontUrl)];
}

export function selectPromoCodeForReferralLink<
  TPromoCode extends PromoCodeCandidate,
  TReferralLink extends ReferralLinkCandidate,
>(link: TReferralLink, promoCodes: TPromoCode[]) {
  const activeCodes = promoCodes
    .filter((promoCode) => promoCode.status === "active")
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

  return (
    activeCodes.find(
      (promoCode) => Boolean(link.campaignId) && promoCode.campaignId === link.campaignId,
    ) ??
    activeCodes.find((promoCode) => promoCode.isPrimary) ??
    activeCodes[0] ??
    null
  );
}

export function buildStorefrontShareUrl(options: {
  referralCode: string;
  destinationUrl: string;
  storefrontUrl?: string | null;
  promoCode?: string | null;
}) {
  const destination = new URL(
    toStorefrontDestinationUrl(options.destinationUrl, options.storefrontUrl),
  );

  destination.searchParams.set("ref", options.referralCode);

  if (!options.promoCode?.trim()) {
    return destination.toString();
  }

  const redirectPath =
    `${destination.pathname}${destination.search}${destination.hash}` || "/";
  const shareUrl = new URL(
    `/discount/${encodeURIComponent(options.promoCode.trim())}`,
    getConfiguredStorefrontUrl(options.storefrontUrl),
  );

  shareUrl.searchParams.set("redirect", redirectPath);

  return shareUrl.toString();
}

export function isOperationalStoreConnection(connection: StoreConnection) {
  return (
    connection.installState === "installed" && connection.status === "connected"
  );
}

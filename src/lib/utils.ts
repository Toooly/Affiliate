import crypto from "node:crypto";

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { env } from "@/lib/env";
import { canonicalizeProgramDestinationUrl } from "@/lib/storefront";
import type { CommissionType, CurrencyCode } from "@/lib/types";

const UI_LOCALE = "it-IT";

const labelMap: Record<string, string> = {
  active: "attivo",
  inactive: "inattivo",
  approved: "approvato",
  paid: "pagato",
  connected: "connesso",
  ready: "pronto",
  healthy: "stabile",
  processed: "elaborato",
  succeeded: "completato",
  installed: "installato",
  granted: "concesso",
  primary: "principale",
  draft: "bozza",
  disabled: "disattivato",
  ended: "conclusa",
  not_connected: "non collegato",
  archived: "archiviato",
  ignored: "ignorato",
  pending: "in attesa",
  processing: "in elaborazione",
  scheduled: "programmata",
  attention_required: "attenzione richiesta",
  restricted: "limitato",
  queued: "in coda",
  installing: "installazione",
  warning: "attenzione",
  partial: "parziale",
  reauth_required: "riautenticazione richiesta",
  rejected: "rifiutato",
  cancelled: "annullato",
  failed: "non riuscito",
  error: "errore",
  degraded: "degradato",
  missing: "mancante",
  reviewed: "verificato",
  dismissed: "archiviato",
  all: "tutti",
  all_campaigns: "tutte le campagne",
  assigned: "assegnato",
  generated: "generato",
  requested: "richiesto",
  percentage: "percentuale",
  fixed: "fissa",
  bank_transfer: "bonifico",
  manual: "manuale",
  multi_platform: "multi-piattaforma",
  "multi-platform": "multi-piattaforma",
  brand_guide: "linee guida brand",
  cash_bonus: "bonus cash",
  gift: "omaggio",
  store_credit: "credito store",
  commission_boost: "boost commissione",
  homepage: "homepage",
  collection: "collezione",
  product: "prodotto",
  page: "pagina",
  image: "immagine",
  video: "video",
  copy: "copy",
  low: "bassa",
  medium: "media",
  high: "alta",
  link: "link",
  promo_code: "codice promo",
  hybrid: "ibrido",
  reward: "reward",
  fraud_flag: "segnalazione rischio",
  application: "candidatura",
  paypal: "paypal",
  stripe: "stripe",
  homepage_link: "link homepage",
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat(UI_LOCALE, {
  numeric: "auto",
});
const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isLocalDevUrl(value: string) {
  try {
    return LOCAL_DEV_HOSTNAMES.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

function stripLocalDevOrigin(value: string) {
  const url = new URL(value);
  return `${url.pathname}${url.search}${url.hash}` || "/";
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uniqueId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeHandle(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.replace(/^@/, "").trim();
}

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function comparePassword(password: string, passwordHash: string) {
  return hashPassword(password) === passwordHash;
}

export function generateDiscountCode(fullName: string, existingCodes: string[]) {
  const base = fullName
    .split(" ")
    .map((part) => part.slice(0, 4))
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);

  let candidate = `${base}10`;
  let index = 10;

  while (existingCodes.includes(candidate)) {
    index += 1;
    candidate = `${base}${index}`;
  }

  return candidate;
}

export function sanitizePromoCode(value: string) {
  return value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9_-]/g, "")
    .replace(/_{2,}/g, "_")
    .replace(/-{2,}/g, "-")
    .slice(0, 24);
}

export function generatePromoCode(
  fullName: string,
  existingCodes: string[],
  prefix = "",
  desiredCode?: string | null,
) {
  const requested = desiredCode ? sanitizePromoCode(desiredCode) : "";

  if (requested && !existingCodes.includes(requested)) {
    return requested;
  }

  const base = sanitizePromoCode(
    `${prefix}${prefix ? "-" : ""}${fullName
      .split(" ")
      .map((part) => part.slice(0, 4))
      .join("")
      .replace(/[^a-zA-Z0-9]/g, "")}`,
  ).slice(0, 18);

  let index = 10;
  let candidate = sanitizePromoCode(`${base}${index}`);

  while (existingCodes.includes(candidate)) {
    index += 1;
    candidate = sanitizePromoCode(`${base}${index}`);
  }

  return candidate;
}

export function generateReferralSlug(fullName: string, existingSlugs: string[]) {
  const base = slugify(fullName).slice(0, 28);
  let candidate = base || "creator";
  let index = 1;

  while (existingSlugs.includes(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  return candidate;
}

export function appendQueryParams(
  destinationUrl: string,
  params: Record<string, string | null | undefined>,
) {
  const url = new URL(normalizeInternalAppUrl(destinationUrl), env.appUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    url.searchParams.set(key, value);
  });

  return url.toString();
}

export function isAllowedDestinationUrl(
  destinationUrl: string,
  allowedDestinationUrls: string[],
) {
  try {
    const target = canonicalizeProgramDestinationUrl(destinationUrl);
    const normalizedAllowedUrls = allowedDestinationUrls.map((url) => {
      return canonicalizeProgramDestinationUrl(url);
    });

    return (
      normalizedAllowedUrls.some(
        (url) => target === url || target.startsWith(url),
      )
    );
  } catch {
    return false;
  }
}

export function calculateCommission(
  orderAmount: number,
  commissionType: CommissionType,
  commissionValue: number,
) {
  if (commissionType === "fixed") {
    return Number(commissionValue.toFixed(2));
  }

  return Number(((orderAmount * commissionValue) / 100).toFixed(2));
}

export function buildPathWithQuery(
  pathname: string,
  params: Record<string, string | null | undefined>,
) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value || value === "all") {
      return;
    }

    nextParams.set(key, value);
  });

  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode = "USD",
  locale = UI_LOCALE,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(UI_LOCALE, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat(UI_LOCALE, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatCommissionRule(type: string | null, value: number | null) {
  if (!type || type === "default" || value === null) {
    return "Default programma";
  }

  if (type === "percentage") {
    return `${value}% commissione`;
  }

  return `${formatCurrency(value)} fissi`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function createAbsoluteUrl(path: string) {
  return new URL(path, env.appUrl).toString();
}

export function toStoredDestinationUrl(value: string) {
  const normalized = normalizeInternalAppUrl(value);

  try {
    const url = new URL(normalized, env.appUrl);
    const appOrigin = new URL(env.appUrl).origin;

    if (url.origin === appOrigin || isLocalDevUrl(url.toString())) {
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }

    return url.toString();
  } catch {
    return value;
  }
}

export function formatPublicUrl(value: string) {
  const normalized = normalizeInternalAppUrl(value);

  try {
    const url = new URL(normalized, env.appUrl);

    if (isLocalDevUrl(url.toString())) {
      return stripLocalDevOrigin(url.toString());
    }

    return url.toString();
  } catch {
    return value;
  }
}

export function createPublicUrl(path: string) {
  return formatPublicUrl(createAbsoluteUrl(path));
}

export function appendQueryParamsToPath(
  destinationUrl: string,
  params: Record<string, string | null | undefined>,
) {
  const url = new URL(destinationUrl, "https://internal.affinity.local");

  Object.entries(params).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    url.searchParams.set(key, value);
  });

  return `${url.pathname}${url.search}${url.hash}` || "/";
}

export function normalizeInternalAppUrl(value: string) {
  try {
    const target = new URL(value, env.appUrl);
    const appUrl = new URL(env.appUrl);

    if (LOCAL_DEV_HOSTNAMES.has(target.hostname) && target.origin !== appUrl.origin) {
      return new URL(`${target.pathname}${target.search}${target.hash}`, appUrl).toString();
    }

    return target.toString();
  } catch {
    return value;
  }
}

export function timeAgo(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();
  const units = [
    { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
    { unit: "day", ms: 1000 * 60 * 60 * 24 },
    { unit: "hour", ms: 1000 * 60 * 60 },
    { unit: "minute", ms: 1000 * 60 },
  ] as const;

  for (const { unit, ms } of units) {
    if (Math.abs(diffMs) >= ms) {
      return relativeTimeFormatter.format(Math.round(diffMs / ms), unit);
    }
  }

  return relativeTimeFormatter.format(Math.round(diffMs / 1000), "second");
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(UI_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat(UI_LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatUiLabel(value: string): string {
  const raw = value.trim();
  const normalized = raw.toLowerCase();

  if (raw.includes(":")) {
    const [prefix, ...rest] = raw.split(":");
    return `${formatUiLabel(prefix)}: ${rest.join(":")}`;
  }

  return labelMap[normalized] ?? raw.replaceAll("_", " ");
}

export function isDateWithinDays(value: string | null, days: number) {
  if (!value) {
    return false;
  }

  const target = new Date(value).getTime();
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return target >= threshold;
}

export function hashIp(value: string | null) {
  if (!value) {
    return null;
  }

  return crypto.createHash("sha256").update(value).digest("hex");
}

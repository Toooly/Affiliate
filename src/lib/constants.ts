import type {
  AudienceSize,
  NavItem,
  PrimaryPlatform,
  Role,
} from "@/lib/types";

export const APP_NAME = "Affinity";
export const APP_TAGLINE = "Operazioni affiliate Shopify";

export const DEFAULT_CURRENCY = "USD" as const;
export const DEFAULT_COMMISSION_TYPE = "percentage" as const;
export const DEFAULT_COMMISSION_VALUE = 15;
export const DEFAULT_REFERRAL_BASE_PATH = "/r";
export const DEFAULT_REFERRAL_DESTINATION_PATH = "/shop";

export const SHOPIFY_SCOPE_OPTIONS = [
  {
    value: "read_products",
    label: "Lettura prodotti",
    description: "Serve per sincronizzare i prodotti promuovibili dagli affiliati.",
  },
  {
    value: "read_content",
    label: "Lettura collezioni e pagine",
    description: "Serve per sincronizzare collezioni e landing page dello storefront.",
  },
  {
    value: "read_discounts",
    label: "Lettura sconti",
    description: "Serve per controllare codici sconto Shopify e relative ownership.",
  },
  {
    value: "write_discounts",
    label: "Scrittura sconti",
    description: "Serve per creare o aggiornare i codici sconto affiliato in Shopify.",
  },
  {
    value: "read_orders",
    label: "Lettura ordini",
    description: "Serve per acquisire ordini e attribuire commissioni dall'attivita del negozio.",
  },
] as const;

export const SHOPIFY_SCOPE_VALUES = SHOPIFY_SCOPE_OPTIONS.map(
  (option) => option.value,
) as [
  (typeof SHOPIFY_SCOPE_OPTIONS)[number]["value"],
  ...(typeof SHOPIFY_SCOPE_OPTIONS)[number]["value"][],
];

export const destinationOptions = [
  {
    label: "Vetrina",
    value: "/shop",
  },
  {
    label: "Best seller",
    value: "/shop?collection=best-sellers",
  },
  {
    label: "Novita",
    value: "/shop?collection=new-arrivals",
  },
  {
    label: "Selezione creator",
    value: "/shop?collection=creator-picks",
  },
] as const;

export const audienceSizeOptions: { label: string; value: AudienceSize }[] = [
  { label: "0-1k", value: "0-1k" },
  { label: "1k-5k", value: "1k-5k" },
  { label: "5k-10k", value: "5k-10k" },
  { label: "10k-25k", value: "10k-25k" },
  { label: "25k-100k", value: "25k-100k" },
  { label: "100k+", value: "100k+" },
];

export const platformOptions: { label: string; value: PrimaryPlatform }[] = [
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
  { label: "YouTube", value: "youtube" },
  { label: "Multi-piattaforma", value: "multi-platform" },
];

export const countryOptions = [
  "Stati Uniti",
  "Regno Unito",
  "Italia",
  "Francia",
  "Germania",
  "Spagna",
  "Canada",
  "Australia",
  "Paesi Bassi",
  "Svezia",
];

export const influencerNav: NavItem[] = [
  {
    title: "Panoramica",
    href: "/dashboard",
    icon: "layout-dashboard",
  },
  {
    title: "Link",
    href: "/dashboard/links",
    icon: "link",
  },
  {
    title: "Codici",
    href: "/dashboard/codes",
    icon: "ticket-percent",
  },
  {
    title: "Campagne",
    href: "/dashboard/campaigns",
    icon: "megaphone",
  },
  {
    title: "Asset",
    href: "/dashboard/assets",
    icon: "images",
  },
  {
    title: "Guadagni",
    href: "/dashboard/earnings",
    icon: "wallet",
  },
  {
    title: "Impostazioni",
    href: "/dashboard/settings",
    icon: "settings",
  },
];

export const adminNav: NavItem[] = [
  {
    title: "Cabina di regia",
    href: "/admin",
    icon: "layout-dashboard",
  },
  {
    title: "Store",
    href: "/admin/store",
    icon: "store",
  },
  {
    title: "Candidature",
    href: "/admin/applications",
    icon: "sparkles",
  },
  {
    title: "Affiliati",
    href: "/admin/affiliates",
    icon: "users",
  },
  {
    title: "Link",
    href: "/admin/links",
    icon: "link",
  },
  {
    title: "Codici",
    href: "/admin/codes",
    icon: "ticket-percent",
  },
  {
    title: "Campagne",
    href: "/admin/campaigns",
    icon: "megaphone",
  },
  {
    title: "Commissioni",
    href: "/admin/conversions",
    icon: "badge-dollar-sign",
  },
  {
    title: "Payout",
    href: "/admin/payouts",
    icon: "wallet",
  },
  {
    title: "Asset",
    href: "/admin/assets",
    icon: "images",
  },
  {
    title: "Impostazioni",
    href: "/admin/settings",
    icon: "settings",
  },
];

export const roleLabels: Record<Role, string> = {
  ADMIN: "Merchant",
  INFLUENCER: "Affiliato",
  MANAGER: "Manager",
};

export const demoCredentials = {
  admin: {
    email: "admin@affinity-demo.com",
    password: "Admin123!",
  },
  influencer: {
    email: "luna@affinity-demo.com",
    password: "Creator123!",
  },
  pending: {
    email: "sophia@affinity-demo.com",
    password: "Creator123!",
  },
};

export const faqItems = [
  {
    question: "Quanto tempo richiede la revisione di una candidatura?",
    answer:
      "La maggior parte dei creator riceve un riscontro entro 2 giorni lavorativi. Dopo l'approvazione, codice promo e referral link vengono generati subito.",
  },
  {
    question: "Come vengono tracciate le commissioni?",
    answer:
      "Ogni creator riceve un referral link e un codice promo univoco. Click, conversioni, fatturato e stato dei payout sono sempre visibili in dashboard.",
  },
  {
    question: "Posso aggiornare i dati payout in un secondo momento?",
    answer:
      "Si. Gli affiliati possono aggiornare preferenze di payout e dati di contatto dalla pagina impostazioni in qualsiasi momento.",
  },
];

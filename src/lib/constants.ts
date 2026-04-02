import type {
  AudienceSize,
  NavItem,
  PrimaryPlatform,
  Role,
} from "@/lib/types";

export const APP_NAME = "Affinity";
export const APP_TAGLINE = "Affiliate operations for Shopify brands";

export const DEFAULT_CURRENCY = "USD" as const;
export const DEFAULT_COMMISSION_TYPE = "percentage" as const;
export const DEFAULT_COMMISSION_VALUE = 10;
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

type ShellQuickAction = {
  label: string;
  href: string;
  icon: NavItem["icon"];
};

type ShellRouteMeta = {
  title: string;
  description: string;
  quickActions: ShellQuickAction[];
};

export const adminShellRouteMeta: Record<string, ShellRouteMeta> = {
  "/admin/affiliates/": {
    title: "Dettaglio affiliato",
    description:
      "Apri il profilo partner, rivedi performance, codici, link, payout e segnali di rischio senza uscire dal flusso operativo.",
    quickActions: [
      { label: "Torna agli affiliati", href: "/admin/affiliates", icon: "users" },
      { label: "Apri link", href: "/admin/links", icon: "link" },
      { label: "Apri payout", href: "/admin/payouts", icon: "wallet" },
    ],
  },
  "/admin/campaigns/": {
    title: "Dettaglio campagna",
    description:
      "Controlla assegnazione, landing, asset, reward e copertura promo della campagna direttamente dalla vista merchant.",
    quickActions: [
      { label: "Tutte le campagne", href: "/admin/campaigns", icon: "megaphone" },
      { label: "Apri affiliati", href: "/admin/affiliates", icon: "users" },
      { label: "Apri asset", href: "/admin/assets", icon: "images" },
    ],
  },
  "/admin/payouts/": {
    title: "Dettaglio payout",
    description:
      "Riconcilia allocazioni, commissioni coperte e stato pagamento senza perdere il contesto del batch payout.",
    quickActions: [
      { label: "Tutti i payout", href: "/admin/payouts", icon: "wallet" },
      { label: "Apri commissioni", href: "/admin/conversions", icon: "badge-dollar-sign" },
      { label: "Apri affiliati", href: "/admin/affiliates", icon: "users" },
    ],
  },
  "/admin/store": {
    title: "Setup store e sync Shopify",
    description:
      "Collega lo store, governa sync, webhook e destinazioni affiliate in modo da tenere stabile il programma lato merchant.",
    quickActions: [
      { label: "Rivedi candidature", href: "/admin/applications", icon: "sparkles" },
      { label: "Apri campagne", href: "/admin/campaigns", icon: "megaphone" },
      { label: "Apri impostazioni", href: "/admin/settings", icon: "settings" },
    ],
  },
  "/admin/applications": {
    title: "Candidature e approvazioni",
    description:
      "Valuta nuovi partner, approva gli account giusti e instradali subito verso codici, link e campagne coerenti.",
    quickActions: [
      { label: "Apri affiliati", href: "/admin/affiliates", icon: "users" },
      { label: "Apri codici", href: "/admin/codes", icon: "ticket-percent" },
      { label: "Apri campagne", href: "/admin/campaigns", icon: "megaphone" },
    ],
  },
  "/admin/affiliates": {
    title: "Gestione affiliati",
    description:
      "Segmenta i partner, apri i dettagli account e collega subito performance, campagne, link e payout allo stesso flusso di lavoro.",
    quickActions: [
      { label: "Apri campagne", href: "/admin/campaigns", icon: "megaphone" },
      { label: "Apri link", href: "/admin/links", icon: "link" },
      { label: "Apri payout", href: "/admin/payouts", icon: "wallet" },
    ],
  },
  "/admin/links": {
    title: "Governance referral link",
    description:
      "Monitora routing, attributi di tracking e rischio sui link che guidano traffico e conversioni del programma affiliate.",
    quickActions: [
      { label: "Apri codici", href: "/admin/codes", icon: "ticket-percent" },
      { label: "Apri campagne", href: "/admin/campaigns", icon: "megaphone" },
      { label: "Apri affiliati", href: "/admin/affiliates", icon: "users" },
    ],
  },
  "/admin/codes": {
    title: "Codici promo e ownership",
    description:
      "Assegna, approva e controlla i codici promo come leva commerciale del programma, mantenendo ownership e commissioni coerenti.",
    quickActions: [
      { label: "Apri link", href: "/admin/links", icon: "link" },
      { label: "Apri campagne", href: "/admin/campaigns", icon: "megaphone" },
      { label: "Apri affiliati", href: "/admin/affiliates", icon: "users" },
    ],
  },
  "/admin/campaigns": {
    title: "Campagne e copertura promozionale",
    description:
      "Costruisci campagne complete con landing, commissioni, asset e assegnazione partner senza uscire dal workspace merchant.",
    quickActions: [
      { label: "Apri asset", href: "/admin/assets", icon: "images" },
      { label: "Apri codici", href: "/admin/codes", icon: "ticket-percent" },
      { label: "Apri affiliati", href: "/admin/affiliates", icon: "users" },
    ],
  },
  "/admin/conversions": {
    title: "Commissioni e attribuzione",
    description:
      "Rivedi ordini attribuiti, approvazioni e rischio prima di far avanzare la pipeline commissioni verso il payout.",
    quickActions: [
      { label: "Apri payout", href: "/admin/payouts", icon: "wallet" },
      { label: "Apri impostazioni", href: "/admin/settings", icon: "settings" },
      { label: "Apri link", href: "/admin/links", icon: "link" },
    ],
  },
  "/admin/payouts": {
    title: "Batch payout e riconciliazione",
    description:
      "Chiudi il ciclo economico del programma controllando allocazioni, stati batch e riferimenti di pagamento per ogni partner.",
    quickActions: [
      { label: "Apri commissioni", href: "/admin/conversions", icon: "badge-dollar-sign" },
      { label: "Apri affiliati", href: "/admin/affiliates", icon: "users" },
      { label: "Apri impostazioni", href: "/admin/settings", icon: "settings" },
    ],
  },
  "/admin/assets": {
    title: "Asset operativi del programma",
    description:
      "Mantieni allineati materiali promozionali, caption e supporti campagna per far lavorare meglio merchant e affiliati.",
    quickActions: [
      { label: "Apri campagne", href: "/admin/campaigns", icon: "megaphone" },
      { label: "Apri affiliati", href: "/admin/affiliates", icon: "users" },
      { label: "Apri link", href: "/admin/links", icon: "link" },
    ],
  },
  "/admin/settings": {
    title: "Regole programma e governance",
    description:
      "Configura antifrode, generazione coupon, destinazioni consentite e readiness operativa del programma da un unico pannello.",
    quickActions: [
      { label: "Setup store", href: "/admin/store", icon: "store" },
      { label: "Apri commissioni", href: "/admin/conversions", icon: "badge-dollar-sign" },
      { label: "Apri payout", href: "/admin/payouts", icon: "wallet" },
    ],
  },
  "/admin": {
    title: "Cabina di regia merchant",
    description:
      "Usa la dashboard admin come centro di controllo per store, candidature, affiliati, campagne, commissioni e payout.",
    quickActions: [
      { label: "Gestisci Shopify", href: "/admin/store", icon: "store" },
      { label: "Rivedi candidature", href: "/admin/applications", icon: "sparkles" },
      { label: "Gestisci affiliati", href: "/admin/affiliates", icon: "users" },
    ],
  },
};

export const influencerShellRouteMeta: Record<string, ShellRouteMeta> = {
  "/dashboard/links": {
    title: "Link tracciati e routing",
    description:
      "Crea nuovi referral link, segmenta per campagna e confronta subito click, conversioni e fatturato delle tue destinazioni.",
    quickActions: [
      { label: "Apri campagne", href: "/dashboard/campaigns", icon: "megaphone" },
      { label: "Apri asset", href: "/dashboard/assets", icon: "images" },
      { label: "Apri guadagni", href: "/dashboard/earnings", icon: "wallet" },
    ],
  },
  "/dashboard/codes": {
    title: "Codici promo e offerte",
    description:
      "Gestisci i codici promo che usi nei contenuti, monitora lo stato richieste e tieni collegata l'offerta alle campagne giuste.",
    quickActions: [
      { label: "Apri campagne", href: "/dashboard/campaigns", icon: "megaphone" },
      { label: "Apri guadagni", href: "/dashboard/earnings", icon: "wallet" },
      { label: "Apri impostazioni", href: "/dashboard/settings", icon: "settings" },
    ],
  },
  "/dashboard/campaigns": {
    title: "Campagne da promuovere",
    description:
      "Apri il hub campagne per capire subito cosa promuovere, quali asset usare e quali link o codici collegare a ogni iniziativa.",
    quickActions: [
      { label: "Apri asset", href: "/dashboard/assets", icon: "images" },
      { label: "Apri link", href: "/dashboard/links", icon: "link" },
      { label: "Apri codici", href: "/dashboard/codes", icon: "ticket-percent" },
    ],
  },
  "/dashboard/assets": {
    title: "Libreria asset e materiali",
    description:
      "Scarica creativita approvate, caption e brand guide per pubblicare piu velocemente senza perdere coerenza con il programma.",
    quickActions: [
      { label: "Apri campagne", href: "/dashboard/campaigns", icon: "megaphone" },
      { label: "Apri link", href: "/dashboard/links", icon: "link" },
      { label: "Apri codici", href: "/dashboard/codes", icon: "ticket-percent" },
    ],
  },
  "/dashboard/earnings": {
    title: "Guadagni, commissioni e payout",
    description:
      "Controlla quanto hai generato, cosa e ancora in attesa e quali payout sono gia stati processati dal programma.",
    quickActions: [
      { label: "Apri impostazioni", href: "/dashboard/settings", icon: "settings" },
      { label: "Apri codici", href: "/dashboard/codes", icon: "ticket-percent" },
      { label: "Apri link", href: "/dashboard/links", icon: "link" },
    ],
  },
  "/dashboard/settings": {
    title: "Profilo, payout e dati account",
    description:
      "Mantieni aggiornati dati profilo, handle social e destinazione payout per rendere fluido il lavoro con il team merchant.",
    quickActions: [
      { label: "Apri guadagni", href: "/dashboard/earnings", icon: "wallet" },
      { label: "Apri link", href: "/dashboard/links", icon: "link" },
      { label: "Apri campagne", href: "/dashboard/campaigns", icon: "megaphone" },
    ],
  },
  "/dashboard": {
    title: "Portale affiliato",
    description:
      "Usa la dashboard partner come base operativa per link, campagne, codici promo, performance e impostazioni payout.",
    quickActions: [
      { label: "Crea link", href: "/dashboard/links", icon: "link" },
      { label: "Apri campagne", href: "/dashboard/campaigns", icon: "megaphone" },
      { label: "Apri guadagni", href: "/dashboard/earnings", icon: "wallet" },
    ],
  },
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Merchant",
  INFLUENCER: "Affiliato",
  MANAGER: "Manager",
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

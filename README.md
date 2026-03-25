# Affinity

Affinity is a premium affiliate and referral operations platform built with Next.js App Router, TypeScript, Tailwind CSS v4 and a Supabase-backed architecture prepared for Shopify.

## What’s included

- public landing page and affiliate application flow
- shared merchant and affiliate login flow
- merchant control room with applications, affiliates, campaigns, promo codes, commissions, payouts and store operations
- affiliate workspace with links, promo codes, campaigns, assets, earnings and settings
- referral click tracking at `/r/[slug]`
- Shopify-ready OAuth, callback, webhook and store-sync seams
- Supabase SQL migrations, RLS policies and seed data aligned with the live product surface
- zero-config local demo mode backed by `data/demo-db.json`

## Core stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Radix UI primitives
- React Hook Form + Zod
- TanStack Table
- Recharts
- Supabase Auth + Postgres + RLS
- Resend-ready email layer

## Docs

- [Architecture](./docs/architecture.md)
- [Database schema](./docs/database-schema.md)
- [Implementation roadmap](./docs/implementation-roadmap.md)
- [Initial Supabase schema](./supabase/migrations/0001_initial_schema.sql)
- [Shopify store ops migration](./supabase/migrations/0002_shopify_store_ops.sql)
- [Affiliate ops expansion migration](./supabase/migrations/0003_affiliate_ops_expansion.sql)

## Run locally

1. Install dependencies.

```bash
npm install
```

2. Copy the environment file.

```bash
cp .env.example .env.local
```

3. Start the app.

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

Local runs default to demo mode if Supabase env vars are empty. That means the whole product works immediately without provisioning external services.

## Demo accounts

- Admin: `admin@affinity-demo.com` / `Admin123!`
- Influencer: `luna@affinity-demo.com` / `Creator123!`
- Pending applicant: `sophia@affinity-demo.com` / `Creator123!`

## Useful scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Demo data

- seeded local data lives in `data/demo-db.json`
- the file is auto-created from `src/lib/demo/seed.ts`
- the app reads and writes that file in demo mode, so admin actions and affiliate changes persist locally

## Supabase setup

When you are ready to switch from demo mode to Supabase:

1. Create a Supabase project.
2. Run the SQL migrations in order:

```bash
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_shopify_store_ops.sql
supabase/migrations/0003_affiliate_ops_expansion.sql
```

3. Optionally run [supabase/seed.sql](./supabase/seed.sql) for a realistic merchant and affiliate dataset.
4. Set:

```bash
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

5. Restart the app.

## Shopify setup

For live Shopify OAuth and bridge functionality, configure:

```bash
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_WEBHOOK_SECRET=...
SHOPIFY_SCOPES=read_products,read_content,read_discounts,write_discounts,read_orders
SHOPIFY_API_VERSION=2025-10
SHOPIFY_TOKEN_ENCRYPTION_KEY=...
```

The current bridge already supports:

- Shopify OAuth install and callback handling
- access-token encryption at rest
- live catalog sync for products, collections and pages
- webhook persistence and retry handling
- typed seams for discount, order and attribution expansion

## Email setup

If you want transactional emails:

```bash
RESEND_API_KEY=...
RESEND_FROM_EMAIL="Affinity <hello@yourdomain.com>"
```

Without those values the app logs email attempts and continues normally.

## Notes

- The app uses a demo repository for zero-config local execution and a Supabase repository for production mode.
- The Supabase layer now covers campaigns, promo codes, suspicious events, payout allocations, program settings and Shopify store operations.
- Manual conversion creation is still supported intentionally so ecommerce sync can replace it later without rewriting dashboard contracts.
- The Shopify bridge persists install state, live catalog sync jobs and webhook ingestion records while leaving room for deeper order-sync automation in later phases.

## Verification

The current project passes:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

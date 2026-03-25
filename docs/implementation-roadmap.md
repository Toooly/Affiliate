# Implementation Roadmap

## Phase 1: Foundation

- scaffold Next.js 15+ App Router app with TypeScript and Tailwind
- add shadcn-style component primitives
- define shared types, validation schemas, helpers, and analytics utilities
- add middleware and session guards

## Phase 2: Core product workflows

- build public landing page
- build creator application flow
- persist pending applications and send receipt emails
- build shared login flow
- add creator pending/rejected status page

## Phase 3: Admin and creator product surfaces

- build creator dashboard with stats, links, code copy, chart, activity, assets, and payout summary
- build creator settings page
- build admin overview KPIs
- build application review queue
- build influencer management table with edit dialog
- build manual conversion entry + conversion ledger
- build payout management
- build promo asset management

## Phase 4: Production hardening

- add Supabase SQL schema, enums, triggers, RLS, and metrics view
- add Resend-ready email layer
- add demo fallback persistence for zero-config local runs
- verify with lint and production build

## Phase 5: Next extensions

- replace manual conversion entry with Shopify and WooCommerce sync jobs
- add coupon sync and order ingestion webhooks
- add Stripe payout execution
- add campaign assets and multi-link attribution
- add manager role workflows and multi-brand tenancy

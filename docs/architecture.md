# Architecture Overview

## Product framing

Affinity is a standalone creator affiliate platform focused on two user roles:

- `ADMIN`: reviews applications, manages creators, records conversions, updates payouts, and publishes promo assets.
- `INFLUENCER`: logs in to retrieve their discount code, referral link, analytics, payout summary, and creative assets.

The platform is organized so Shopify install/auth, referral attribution, commissions, and payout operations can run end-to-end without rewriting core product flows.

## App layers

### 1. Presentation

- Next.js App Router pages live in `src/app`
- shared UI primitives live in `src/components/ui`
- product-level patterns live in `src/components/shared`, `src/components/forms`, `src/components/tables`, and `src/components/charts`

### 2. Application logic

- server actions live in `src/app/actions`
- auth/session guards live in `src/lib/auth`
- validation schemas live in `src/lib/validations`
- email helpers live in `src/lib/email`

### 3. Data access

- `src/lib/data/repository.ts` selects the active backend
- `src/lib/data/demo-repository.ts` is the runnable local development backend
- `src/lib/data/supabase-repository.ts` is the production backend implementation
- `src/lib/data/analytics.ts` centralizes metric calculations

### 4. Persistence

- local development fallback persists to `data/demo-db.json`
- production mode is designed around Supabase Postgres + Auth + RLS
- SQL bootstrap lives in `supabase/migrations/0001_initial_schema.sql`
- invite onboarding and attribution extensions live in `supabase/migrations/0004_affiliate_invites.sql`
- seed SQL lives in `supabase/seed.sql`

## Folder architecture

```text
src/
  app/
    actions/
    admin/
    application/pending/
    apply/
    dashboard/
    login/
    r/[slug]/
    shop/
  components/
    charts/
    forms/
    layout/
    shared/
    tables/
    ui/
  lib/
    auth/
    data/
    demo/
    email/
    supabase/
    validations/
docs/
supabase/
  migrations/
data/
```

## Routing model

- `/`: landing page for the creator program
- `/apply`: public application form
- `/login`: shared login screen for creators and admins
- `/register`: public affiliate activation and invite onboarding route
- `/application/pending`: pending/rejected holding state for non-approved creators
- `/dashboard`: creator dashboard
- `/dashboard/settings`: creator profile + payout settings
- `/admin`: KPI overview
- `/admin/applications`: application review queue
- `/admin/influencers`: creator management table
- `/admin/conversions`: conversion ledger, approval state, payout readiness
- `/admin/payouts`: payout management
- `/admin/assets`: promo asset management
- `/r/[slug]`: referral click tracker + redirector
- `/shop`: internal storefront surface used for local verification and referral propagation

## Auth and RBAC strategy

### Local development fallback

- enabled automatically when Supabase env vars are missing
- uses a signed-ish httpOnly cookie (`affinity_demo_session`) plus file-backed records
- lets the project run locally with no external services

### Supabase mode

- uses Supabase email/password auth
- `profiles.auth_user_id` links app-level RBAC to `auth.uid()`
- middleware refreshes the Supabase session
- server guards redirect by role and creator approval status

### RBAC rules

- `ADMIN` can access all admin routes and all program data
- `INFLUENCER` can access only their own profile, influencer row, referral links, clicks, conversions, payouts, and assigned assets
- pending or rejected creators can authenticate but are redirected to `/application/pending`

## Data flow

### Creator application

1. Public form validates with RHF + Zod.
2. Server action writes a pending application or immediately activates an invited affiliate.
3. Email confirmation is sent through Resend when configured.
4. Admin reviews from `/admin/applications`.

### Approval

1. Admin approves application.
2. Repository creates or activates the influencer record.
3. Unique discount code and referral slug are generated.
4. Primary referral link is created.
5. Approval + welcome emails are sent.

### Invite onboarding

1. Admin generates an invite link from `/admin/applications`.
2. Public user opens `/register?invite=...`.
3. Repository validates token, email match, expiry, and claim status.
4. Affiliate profile, primary referral link, and promo code are created automatically.
5. Invite is marked as claimed and visible in merchant history.

### Tracking and analytics

1. Referral visits hit `/r/[slug]`.
2. Route handler stores a click event, persists an attribution cookie, and forwards `ref` to the destination.
3. Shopify storefront capture can persist `affiliate_ref` through the theme app extension.
4. Order ingestion maps referral or discount data into conversions and 10% commissions.
5. Dashboard and admin KPIs are derived from centralized analytics helpers.

## Future-ready seams

- `program_settings` allows global defaults and future per-brand configuration
- `audit_logs` keeps key actions extensible for compliance and ops
- `referral_links` supports multiple links or campaign links later
- `commission_type` + `commission_value` are compatible with fixed or percentage models
- `promo_assets` + `influencer_asset_access` can evolve into campaign asset delivery
- repository abstraction keeps local development fallback and production infrastructure behind the same contract

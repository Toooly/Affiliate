# Architecture Overview

## Product framing

Affinity is a standalone creator affiliate platform focused on two user roles:

- `ADMIN`: reviews applications, manages creators, records conversions, updates payouts, and publishes promo assets.
- `INFLUENCER`: logs in to retrieve their discount code, referral link, analytics, payout summary, and creative assets.

The MVP is intentionally standalone, but the internals are organized so ecommerce and payout integrations can be layered in without rewriting core product flows.

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
- `src/lib/data/demo-repository.ts` is the runnable local backend
- `src/lib/data/supabase-repository.ts` is the production backend seam
- `src/lib/data/analytics.ts` centralizes metric calculations

### 4. Persistence

- local demo mode persists to `data/demo-db.json`
- production mode is designed around Supabase Postgres + Auth + RLS
- SQL bootstrap lives in `supabase/migrations/0001_initial_schema.sql`
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
- `/application/pending`: pending/rejected holding state for non-approved creators
- `/dashboard`: creator dashboard
- `/dashboard/settings`: creator profile + payout settings
- `/admin`: KPI overview
- `/admin/applications`: application review queue
- `/admin/influencers`: creator management table
- `/admin/conversions`: manual conversion creation + list
- `/admin/payouts`: payout management
- `/admin/assets`: promo asset management
- `/r/[slug]`: referral click tracker + redirector
- `/shop`: mock storefront destination used in demo mode

## Auth and RBAC strategy

### Demo mode

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
2. Server action writes a pending application.
3. Email confirmation is sent through Resend when configured.
4. Admin reviews from `/admin/applications`.

### Approval

1. Admin approves application.
2. Repository creates or activates the influencer record.
3. Unique discount code and referral slug are generated.
4. Primary referral link is created.
5. Approval + welcome emails are sent.

### Tracking and analytics

1. Referral visits hit `/r/[slug]`.
2. Route handler stores a click event.
3. Admin records conversions manually in MVP.
4. Dashboard and admin KPIs are derived from centralized analytics helpers.

## Future-ready seams

- `program_settings` allows global defaults and future per-brand configuration
- `audit_logs` keeps key actions extensible for compliance and ops
- `referral_links` supports multiple links or campaign links later
- `commission_type` + `commission_value` are compatible with fixed or percentage models
- `promo_assets` + `influencer_asset_access` can evolve into campaign asset delivery
- repository abstraction allows ecommerce sync jobs to replace manual conversion creation later

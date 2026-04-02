# Delivery Roadmap

## Completed in this repository

- officialized merchant and affiliate UX copy across landing, login, dashboard, store ops, and settings
- removed visible demo shortcuts, demo CTAs, exposed localhost references, and obvious seed fillers from product surfaces
- added invite-based affiliate onboarding with tracked registration links and automatic partner activation
- aligned the commission model to 10% by default across settings, approvals, conversions, and payouts
- implemented referral redirect propagation so `ref` survives into the destination storefront
- added Shopify OAuth install/callback/webhook bridge plus connection persistence by merchant owner
- scaffolded a Shopify theme app extension for storefront referral capture and cart attribute persistence
- added end-to-end smoke coverage for admin login, invite generation, affiliate signup, referral tracking, conversion attribution, and commission visibility

## Required to go live in production

- apply Supabase migrations through `0004_affiliate_invites.sql`
- populate production env vars for Supabase, Resend, and Shopify on the host platform
- generate `shopify.app.toml` from production env using `npm run shopify:config`
- create or update the Shopify app in Partner Dashboard / CLI with the generated URLs and scopes
- deploy the current repository state to the production host
- enable the theme app embed from `extensions/affinity-referral-tracker` on the merchant storefront
- complete a live install on the target Shopify store and verify webhook delivery from Shopify to `/api/webhooks/shopify`

## Next extensions

- replace manual store-event ingestion with live Shopify webhook-only attribution in merchant operations
- sync discount creation back to Shopify when merchant approves new promo codes
- add payout execution through Stripe or banking rail integrations
- add multi-store or multi-brand tenancy if the platform expands beyond a single merchant workspace

# Database Schema

## Core enums

- `app_role`: `ADMIN`, `INFLUENCER`, `MANAGER`
- `application_status`: `pending`, `approved`, `rejected`
- `commission_type`: `percentage`, `fixed`
- `conversion_status`: `pending`, `approved`, `paid`, `cancelled`
- `payout_status`: `draft`, `pending`, `processing`, `paid`, `failed`
- `payout_method`: `paypal`, `bank_transfer`, `stripe`, `manual`
- `promo_asset_type`: `image`, `video`, `copy`, `brand_guide`

## Tables

### `profiles`

Stores app-level RBAC and public account details.

Key columns:

- `id`
- `auth_user_id`
- `role`
- `full_name`
- `email`
- `avatar_url`
- `country`

### `influencer_applications`

Captures creator signups before approval.

Key columns:

- `profile_id`
- `auth_user_id`
- `instagram_handle`
- `tiktok_handle`
- `youtube_handle`
- `primary_platform`
- `audience_size`
- `niche`
- `message`
- `status`
- `reviewed_by`
- `review_notes`

### `influencers`

The approved creator account record.

Key columns:

- `profile_id`
- `application_id`
- `public_slug`
- `discount_code`
- `commission_type`
- `commission_value`
- `is_active`
- `payout_method`
- `payout_email`
- `notes`

### `referral_links`

Tracks one or more trackable URLs for a creator.

Key columns:

- `influencer_id`
- `code`
- `destination_url`
- `is_primary`

### `link_clicks`

Raw click ledger for referral attribution.

Key columns:

- `influencer_id`
- `referral_link_id`
- `visitor_id`
- `referrer`
- `user_agent`
- `ip_hash`
- `utm_source`
- `utm_medium`
- `utm_campaign`

### `conversions`

Represents attributed orders or manually inserted conversions.

Key columns:

- `influencer_id`
- `referral_link_id`
- `order_id`
- `customer_email`
- `order_amount`
- `currency`
- `commission_type`
- `commission_value`
- `commission_amount`
- `status`

### `payouts`

Tracks commission disbursements.

Key columns:

- `influencer_id`
- `amount`
- `currency`
- `status`
- `method`
- `reference`
- `paid_at`

### `promo_assets`

Creator-facing assets or brand collateral.

### `influencer_asset_access`

Join table for asset visibility by influencer.

### `program_settings`

Global defaults for commission and referral behavior.

### `audit_logs`

Append-only action history for admin workflows and future observability.

## Key constraints

- `profiles.email` unique
- `profiles.auth_user_id` unique when present
- `influencer_applications.email` unique
- `influencers.profile_id` unique
- `influencers.public_slug` unique
- `influencers.discount_code` unique
- `referral_links.code` unique

## Analytics strategy

Dashboard and admin metrics are derived from `link_clicks`, `conversions`, and `payouts`.

- clicks = count of `link_clicks`
- conversions = count of `conversions` excluding `cancelled`
- revenue = sum of `order_amount` excluding `cancelled`
- total commission = sum of `commission_amount` excluding `cancelled`
- pending commission = total commission where status is not `paid`
- paid commission = total commission where status is `paid`

## Security strategy

- RLS is enabled on all business tables
- helper functions map `auth.uid()` to `profiles.id`
- creators can only read their own tenant data
- admins/managers can read and manage global data

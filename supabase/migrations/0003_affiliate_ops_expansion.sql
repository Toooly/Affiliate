do $$
begin
  create type public.payout_provider_status as enum ('not_connected', 'ready', 'restricted');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.promo_code_status as enum ('active', 'pending', 'rejected', 'disabled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.promo_code_source as enum ('assigned', 'generated', 'requested');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.campaign_status as enum ('draft', 'scheduled', 'active', 'ended');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.reward_type as enum ('cash_bonus', 'gift', 'store_credit', 'commission_boost');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.reward_status as enum ('available', 'earned', 'issued', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.suspicious_event_type as enum ('self_referral', 'repeated_ip', 'coupon_mismatch', 'conversion_spike', 'manual_review');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.suspicious_event_severity as enum ('low', 'medium', 'high');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.suspicious_event_status as enum ('open', 'reviewed', 'dismissed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attribution_source as enum ('link', 'promo_code', 'hybrid', 'manual');
exception
  when duplicate_object then null;
end $$;

alter table public.program_settings
  add column if not exists allow_affiliate_code_generation boolean not null default true,
  add column if not exists allow_promo_code_requests boolean not null default true,
  add column if not exists allow_custom_link_destinations boolean not null default true,
  add column if not exists promo_code_prefix text not null default 'AFF',
  add column if not exists email_brand_name text not null default 'Affinity',
  add column if not exists email_reply_to text not null default 'partners@example.com',
  add column if not exists anti_leak_enabled boolean not null default true,
  add column if not exists block_self_referrals boolean not null default true,
  add column if not exists require_code_ownership_match boolean not null default true,
  add column if not exists fraud_review_enabled boolean not null default true,
  add column if not exists max_clicks_per_ip_per_day integer not null default 6,
  add column if not exists max_conversions_per_ip_per_day integer not null default 2,
  add column if not exists enable_rewards boolean not null default true,
  add column if not exists enable_store_credit boolean not null default false,
  add column if not exists enable_marketplace boolean not null default false,
  add column if not exists enable_multi_level boolean not null default false,
  add column if not exists enable_multi_program boolean not null default false,
  add column if not exists enable_auto_payouts boolean not null default false,
  add column if not exists allowed_destination_urls text[] not null default '{}'::text[];

alter table public.influencers
  add column if not exists payout_provider_status public.payout_provider_status not null default 'not_connected',
  add column if not exists company_name text,
  add column if not exists tax_id text,
  add column if not exists notification_email text,
  add column if not exists notifications_enabled boolean not null default true;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  landing_url text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status public.campaign_status not null default 'draft',
  commission_type public.commission_type,
  commission_value numeric(10, 2),
  bonus_title text,
  bonus_description text,
  bonus_type public.reward_type,
  bonus_value numeric(10, 2),
  applies_to_all boolean not null default true,
  affiliate_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  code text not null unique,
  discount_value numeric(10, 2) not null default 10,
  status public.promo_code_status not null default 'active',
  source public.promo_code_source not null default 'assigned',
  is_primary boolean not null default false,
  request_message text,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.referral_links
  add column if not exists name text not null default 'Primary storefront link',
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz,
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

alter table public.conversions
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null,
  add column if not exists attribution_source public.attribution_source not null default 'manual';

create table if not exists public.payout_allocations (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  conversion_id uuid not null references public.conversions(id) on delete cascade,
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  amount numeric(12, 2) not null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique (payout_id, conversion_id)
);

alter table public.promo_assets
  add column if not exists caption text,
  add column if not exists instructions text,
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid references public.influencers(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  type public.reward_type not null,
  title text not null,
  description text not null,
  value numeric(10, 2),
  currency text not null default 'USD',
  status public.reward_status not null default 'available',
  issued_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.suspicious_events (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  referral_link_id uuid references public.referral_links(id) on delete set null,
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  conversion_id uuid references public.conversions(id) on delete set null,
  type public.suspicious_event_type not null,
  severity public.suspicious_event_severity not null default 'medium',
  status public.suspicious_event_status not null default 'open',
  title text not null,
  detail text not null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists campaigns_status_idx
  on public.campaigns (status, start_date desc);

create index if not exists promo_codes_influencer_idx
  on public.promo_codes (influencer_id, status, created_at desc);

create index if not exists promo_codes_campaign_idx
  on public.promo_codes (campaign_id, status);

create index if not exists referral_links_campaign_idx
  on public.referral_links (campaign_id, is_active, created_at desc);

create index if not exists conversions_promo_code_idx
  on public.conversions (promo_code_id, status, created_at desc);

create index if not exists payout_allocations_payout_idx
  on public.payout_allocations (payout_id, created_at desc);

create index if not exists payout_allocations_conversion_idx
  on public.payout_allocations (conversion_id);

create index if not exists rewards_campaign_idx
  on public.rewards (campaign_id, status, created_at desc);

create index if not exists suspicious_events_influencer_idx
  on public.suspicious_events (influencer_id, status, created_at desc);

create index if not exists suspicious_events_conversion_idx
  on public.suspicious_events (conversion_id, status);

drop trigger if exists campaigns_touch_updated_at on public.campaigns;
create trigger campaigns_touch_updated_at
before update on public.campaigns
for each row execute function public.touch_updated_at();

drop trigger if exists promo_codes_touch_updated_at on public.promo_codes;
create trigger promo_codes_touch_updated_at
before update on public.promo_codes
for each row execute function public.touch_updated_at();

update public.program_settings
set
  promo_code_prefix = coalesce(promo_code_prefix, 'AFF'),
  email_brand_name = coalesce(email_brand_name, 'Affinity'),
  email_reply_to = coalesce(email_reply_to, 'partners@example.com'),
  allowed_destination_urls = case
    when coalesce(array_length(allowed_destination_urls, 1), 0) > 0 then allowed_destination_urls
    else array['http://localhost:3000/shop']
  end;

update public.influencers
set
  payout_provider_status = case
    when payout_method = 'paypal' then 'ready'::public.payout_provider_status
    else coalesce(payout_provider_status, 'not_connected'::public.payout_provider_status)
  end,
  notification_email = coalesce(notification_email, payout_email);

update public.referral_links
set
  name = coalesce(name, 'Primary storefront link'),
  is_active = coalesce(is_active, true);

alter table public.campaigns enable row level security;
alter table public.promo_codes enable row level security;
alter table public.payout_allocations enable row level security;
alter table public.rewards enable row level security;
alter table public.suspicious_events enable row level security;

create policy "campaigns_select_authenticated"
on public.campaigns
for select
using (auth.uid() is not null);

create policy "campaigns_manage_admin_only"
on public.campaigns
for all
using (public.is_admin())
with check (public.is_admin());

create policy "promo_codes_select_self_or_admin"
on public.promo_codes
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = promo_codes.influencer_id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "promo_codes_manage_admin_only"
on public.promo_codes
for all
using (public.is_admin())
with check (public.is_admin());

create policy "payout_allocations_select_self_or_admin"
on public.payout_allocations
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = payout_allocations.influencer_id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "payout_allocations_manage_admin_only"
on public.payout_allocations
for all
using (public.is_admin())
with check (public.is_admin());

create policy "rewards_select_self_or_admin"
on public.rewards
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = rewards.influencer_id
      and i.profile_id = public.current_profile_id()
  )
  or rewards.influencer_id is null
);

create policy "rewards_manage_admin_only"
on public.rewards
for all
using (public.is_admin())
with check (public.is_admin());

create policy "suspicious_events_select_self_or_admin"
on public.suspicious_events
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = suspicious_events.influencer_id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "suspicious_events_manage_admin_only"
on public.suspicious_events
for all
using (public.is_admin())
with check (public.is_admin());

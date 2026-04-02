create extension if not exists pgcrypto;

create type public.app_role as enum ('ADMIN', 'INFLUENCER', 'MANAGER');
create type public.application_status as enum ('pending', 'approved', 'rejected');
create type public.commission_type as enum ('percentage', 'fixed');
create type public.conversion_status as enum ('pending', 'approved', 'paid', 'cancelled');
create type public.payout_status as enum ('draft', 'pending', 'processing', 'paid', 'failed');
create type public.payout_method as enum ('paypal', 'bank_transfer', 'stripe', 'manual');
create type public.promo_asset_type as enum ('image', 'video', 'copy', 'brand_guide');

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  role public.app_role not null default 'INFLUENCER',
  full_name text not null,
  email text not null,
  avatar_url text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email));

create table if not exists public.influencer_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  auth_user_id uuid,
  full_name text not null,
  email text not null,
  instagram_handle text not null,
  tiktok_handle text,
  youtube_handle text,
  primary_platform text not null,
  audience_size text not null,
  country text not null,
  niche text not null,
  message text not null,
  consent_accepted boolean not null default true,
  status public.application_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists influencer_applications_email_unique_idx
  on public.influencer_applications (lower(email));

create index if not exists influencer_applications_status_idx
  on public.influencer_applications (status, created_at desc);

create table if not exists public.program_settings (
  id uuid primary key default gen_random_uuid(),
  default_commission_type public.commission_type not null default 'percentage',
  default_commission_value numeric(10, 2) not null default 10,
  default_currency text not null default 'USD',
  referral_base_path text not null default '/r',
  default_referral_destination_path text not null default '/shop',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.influencers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  application_id uuid references public.influencer_applications(id) on delete set null,
  public_slug text not null unique,
  discount_code text not null unique,
  commission_type public.commission_type not null,
  commission_value numeric(10, 2) not null,
  is_active boolean not null default true,
  payout_method public.payout_method,
  payout_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists influencers_is_active_idx
  on public.influencers (is_active, created_at desc);

create table if not exists public.referral_links (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  code text not null unique,
  destination_url text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists referral_links_influencer_idx
  on public.referral_links (influencer_id, is_primary desc);

create table if not exists public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  referral_link_id uuid references public.referral_links(id) on delete set null,
  visitor_id text not null,
  referrer text,
  user_agent text,
  ip_hash text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create index if not exists link_clicks_influencer_idx
  on public.link_clicks (influencer_id, created_at desc);

create index if not exists link_clicks_referral_link_idx
  on public.link_clicks (referral_link_id, created_at desc);

create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  referral_link_id uuid references public.referral_links(id) on delete set null,
  order_id text not null unique,
  customer_email text,
  order_amount numeric(12, 2) not null,
  currency text not null default 'USD',
  commission_type public.commission_type not null,
  commission_value numeric(10, 2) not null,
  commission_amount numeric(12, 2) not null,
  status public.conversion_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversions_influencer_idx
  on public.conversions (influencer_id, status, created_at desc);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  status public.payout_status not null default 'draft',
  method public.payout_method not null default 'manual',
  reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payouts_influencer_idx
  on public.payouts (influencer_id, status, created_at desc);

create table if not exists public.promo_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type public.promo_asset_type not null,
  file_url text not null,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists promo_assets_is_active_idx
  on public.promo_assets (is_active, created_at desc);

create table if not exists public.influencer_asset_access (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  asset_id uuid not null references public.promo_assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (influencer_id, asset_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists applications_touch_updated_at on public.influencer_applications;
create trigger applications_touch_updated_at
before update on public.influencer_applications
for each row execute function public.touch_updated_at();

drop trigger if exists influencers_touch_updated_at on public.influencers;
create trigger influencers_touch_updated_at
before update on public.influencers
for each row execute function public.touch_updated_at();

drop trigger if exists conversions_touch_updated_at on public.conversions;
create trigger conversions_touch_updated_at
before update on public.conversions
for each row execute function public.touch_updated_at();

drop trigger if exists program_settings_touch_updated_at on public.program_settings;
create trigger program_settings_touch_updated_at
before update on public.program_settings
for each row execute function public.touch_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('ADMIN', 'MANAGER'), false);
$$;

create or replace view public.creator_metrics_view as
select
  i.id as influencer_id,
  i.profile_id,
  count(distinct lc.id) as clicks,
  count(distinct c.id) filter (where c.status <> 'cancelled') as conversions,
  coalesce(sum(c.order_amount) filter (where c.status <> 'cancelled'), 0) as revenue,
  coalesce(sum(c.commission_amount) filter (where c.status <> 'cancelled'), 0) as total_commission,
  coalesce(sum(c.commission_amount) filter (where c.status = 'paid'), 0) as paid_commission,
  coalesce(sum(c.commission_amount) filter (where c.status <> 'cancelled' and c.status <> 'paid'), 0) as pending_commission
from public.influencers i
left join public.link_clicks lc on lc.influencer_id = i.id
left join public.conversions c on c.influencer_id = i.id
group by i.id, i.profile_id;

alter table public.profiles enable row level security;
alter table public.influencer_applications enable row level security;
alter table public.program_settings enable row level security;
alter table public.influencers enable row level security;
alter table public.referral_links enable row level security;
alter table public.link_clicks enable row level security;
alter table public.conversions enable row level security;
alter table public.payouts enable row level security;
alter table public.promo_assets enable row level security;
alter table public.influencer_asset_access enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (id = public.current_profile_id() or public.is_admin());

create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (id = public.current_profile_id() or public.is_admin())
with check (id = public.current_profile_id() or public.is_admin());

create policy "applications_select_self_or_admin"
on public.influencer_applications
for select
using (
  public.is_admin()
  or profile_id = public.current_profile_id()
  or auth_user_id = auth.uid()
);

create policy "applications_insert_self_or_admin"
on public.influencer_applications
for insert
with check (
  public.is_admin()
  or auth_user_id = auth.uid()
);

create policy "applications_update_admin_only"
on public.influencer_applications
for update
using (public.is_admin())
with check (public.is_admin());

create policy "program_settings_select_authenticated"
on public.program_settings
for select
using (auth.uid() is not null);

create policy "program_settings_update_admin_only"
on public.program_settings
for update
using (public.is_admin())
with check (public.is_admin());

create policy "influencers_select_self_or_admin"
on public.influencers
for select
using (profile_id = public.current_profile_id() or public.is_admin());

create policy "influencers_update_admin_only"
on public.influencers
for update
using (public.is_admin())
with check (public.is_admin());

create policy "referral_links_select_self_or_admin"
on public.referral_links
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = influencer_id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "link_clicks_select_self_or_admin"
on public.link_clicks
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = influencer_id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "conversions_select_self_or_admin"
on public.conversions
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = influencer_id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "conversions_manage_admin_only"
on public.conversions
for all
using (public.is_admin())
with check (public.is_admin());

create policy "payouts_select_self_or_admin"
on public.payouts
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = influencer_id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "payouts_manage_admin_only"
on public.payouts
for all
using (public.is_admin())
with check (public.is_admin());

create policy "promo_assets_select_admin_or_assigned"
on public.promo_assets
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencer_asset_access ia
    join public.influencers i on i.id = ia.influencer_id
    where ia.asset_id = promo_assets.id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "promo_assets_manage_admin_only"
on public.promo_assets
for all
using (public.is_admin())
with check (public.is_admin());

create policy "asset_access_select_self_or_admin"
on public.influencer_asset_access
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.influencers i
    where i.id = influencer_id
      and i.profile_id = public.current_profile_id()
  )
);

create policy "asset_access_manage_admin_only"
on public.influencer_asset_access
for all
using (public.is_admin())
with check (public.is_admin());

create policy "audit_logs_select_admin_only"
on public.audit_logs
for select
using (public.is_admin());

create policy "audit_logs_insert_admin_only"
on public.audit_logs
for insert
with check (public.is_admin());

insert into public.program_settings (
  default_commission_type,
  default_commission_value,
  default_currency,
  referral_base_path,
  default_referral_destination_path
)
select 'percentage', 10, 'USD', '/r', '/shop'
where not exists (
  select 1 from public.program_settings
);

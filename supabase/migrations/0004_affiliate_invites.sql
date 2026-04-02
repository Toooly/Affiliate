create table if not exists public.affiliate_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  invited_name text,
  invited_email text,
  note text,
  campaign_id uuid references public.campaigns(id) on delete set null,
  commission_type public.commission_type not null default 'percentage',
  commission_value numeric(10, 2) not null default 10,
  payout_method public.payout_method not null default 'paypal',
  expires_at timestamptz,
  claimed_at timestamptz,
  claimed_profile_id uuid references public.profiles(id) on delete set null,
  claimed_application_id uuid references public.influencer_applications(id) on delete set null,
  claimed_influencer_id uuid references public.influencers(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.influencer_applications
  add column if not exists source text not null default 'public_application',
  add column if not exists invite_id uuid references public.affiliate_invites(id) on delete set null;

create index if not exists affiliate_invites_created_at_idx
  on public.affiliate_invites (created_at desc);

create index if not exists affiliate_invites_invited_email_idx
  on public.affiliate_invites (lower(invited_email));

create index if not exists influencer_applications_source_idx
  on public.influencer_applications (source, created_at desc);

drop trigger if exists affiliate_invites_touch_updated_at on public.affiliate_invites;
create trigger affiliate_invites_touch_updated_at
before update on public.affiliate_invites
for each row execute function public.touch_updated_at();

update public.program_settings
set default_commission_value = 10
where default_commission_value = 15;

alter table public.program_settings
  alter column default_commission_value set default 10;

update public.influencer_applications
set source = 'public_application'
where source is null;

alter table public.affiliate_invites enable row level security;

create policy "affiliate_invites_select_admin_only"
on public.affiliate_invites
for select
using (public.is_admin());

create policy "affiliate_invites_manage_admin_only"
on public.affiliate_invites
for all
using (public.is_admin())
with check (public.is_admin());

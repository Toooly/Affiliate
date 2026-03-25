do $$
begin
  create type public.shopify_install_state as enum ('not_installed', 'installing', 'installed', 'reauth_required');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.store_connection_status as enum ('not_connected', 'attention_required', 'connected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.connection_health_status as enum ('healthy', 'warning', 'degraded', 'error');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.store_catalog_type as enum ('homepage', 'collection', 'product', 'page');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.store_sync_job_type as enum ('products', 'collections', 'pages', 'discounts', 'orders', 'attribution');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.store_sync_job_mode as enum ('incremental', 'full', 'retry');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.store_sync_job_status as enum ('queued', 'running', 'succeeded', 'failed', 'partial');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.store_sync_source as enum ('shopify', 'internal', 'hybrid');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.webhook_processing_status as enum ('received', 'processing', 'processed', 'failed', 'ignored');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.store_connections (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  platform text not null default 'shopify',
  store_name text not null,
  shop_domain text not null unique,
  storefront_url text not null,
  default_destination_url text not null,
  install_state public.shopify_install_state not null default 'not_installed',
  status public.store_connection_status not null default 'not_connected',
  connection_health public.connection_health_status not null default 'warning',
  sync_products_enabled boolean not null default true,
  sync_discount_codes_enabled boolean not null default true,
  order_attribution_enabled boolean not null default true,
  auto_create_discount_codes boolean not null default true,
  app_embed_enabled boolean not null default false,
  required_scopes text[] not null default '{}'::text[],
  granted_scopes text[] not null default '{}'::text[],
  access_token_encrypted text,
  token_updated_at timestamptz,
  installed_at timestamptz,
  connected_at timestamptz,
  last_health_check_at timestamptz,
  last_health_error text,
  last_products_sync_at timestamptz,
  last_discount_sync_at timestamptz,
  last_orders_sync_at timestamptz,
  last_webhook_at timestamptz,
  products_synced_count integer not null default 0,
  collections_synced_count integer not null default 0,
  discounts_synced_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_catalog_items (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.store_connections(id) on delete cascade,
  shopify_resource_id text not null,
  title text not null,
  type public.store_catalog_type not null,
  handle text,
  destination_url text not null,
  is_affiliate_enabled boolean not null default true,
  is_featured boolean not null default false,
  source_updated_at timestamptz,
  last_synced_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, shopify_resource_id)
);

create table if not exists public.store_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.store_connections(id) on delete cascade,
  type public.store_sync_job_type not null,
  mode public.store_sync_job_mode not null,
  status public.store_sync_job_status not null default 'queued',
  source_of_truth public.store_sync_source not null default 'shopify',
  triggered_by text not null default 'merchant',
  requested_by uuid references public.profiles(id) on delete set null,
  parent_job_id uuid references public.store_sync_jobs(id) on delete set null,
  notes text,
  error_message text,
  cursor text,
  records_processed integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  records_failed integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_ingestion_records (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.store_connections(id) on delete set null,
  topic text not null,
  shop_domain text not null,
  external_event_id text not null,
  webhook_id text,
  idempotency_key text not null unique,
  status public.webhook_processing_status not null default 'received',
  attempts integer not null default 1,
  error_message text,
  order_id text,
  referral_code text,
  discount_code text,
  influencer_id uuid references public.influencers(id) on delete set null,
  campaign_id text,
  conversion_id uuid references public.conversions(id) on delete set null,
  payload_summary jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  headers jsonb not null default '{}'::jsonb,
  hmac_valid boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_catalog_items_connection_idx
  on public.store_catalog_items (connection_id, type, updated_at desc);

create index if not exists store_sync_jobs_connection_idx
  on public.store_sync_jobs (connection_id, created_at desc);

create index if not exists store_sync_jobs_status_idx
  on public.store_sync_jobs (status, created_at desc);

create index if not exists webhook_ingestion_records_connection_idx
  on public.webhook_ingestion_records (connection_id, created_at desc);

create index if not exists webhook_ingestion_records_status_idx
  on public.webhook_ingestion_records (status, created_at desc);

drop trigger if exists store_connections_touch_updated_at on public.store_connections;
create trigger store_connections_touch_updated_at
before update on public.store_connections
for each row execute procedure public.touch_updated_at();

drop trigger if exists store_catalog_items_touch_updated_at on public.store_catalog_items;
create trigger store_catalog_items_touch_updated_at
before update on public.store_catalog_items
for each row execute procedure public.touch_updated_at();

drop trigger if exists store_sync_jobs_touch_updated_at on public.store_sync_jobs;
create trigger store_sync_jobs_touch_updated_at
before update on public.store_sync_jobs
for each row execute procedure public.touch_updated_at();

drop trigger if exists webhook_ingestion_records_touch_updated_at on public.webhook_ingestion_records;
create trigger webhook_ingestion_records_touch_updated_at
before update on public.webhook_ingestion_records
for each row execute procedure public.touch_updated_at();

alter table public.store_connections enable row level security;
alter table public.store_catalog_items enable row level security;
alter table public.store_sync_jobs enable row level security;
alter table public.webhook_ingestion_records enable row level security;

create policy "store_connections_select_authenticated"
on public.store_connections
for select
using (auth.uid() is not null);

create policy "store_connections_update_admin_only"
on public.store_connections
for all
using (public.is_admin())
with check (public.is_admin());

create policy "store_catalog_items_select_authenticated"
on public.store_catalog_items
for select
using (auth.uid() is not null);

create policy "store_catalog_items_update_admin_only"
on public.store_catalog_items
for all
using (public.is_admin())
with check (public.is_admin());

create policy "store_sync_jobs_select_authenticated"
on public.store_sync_jobs
for select
using (auth.uid() is not null);

create policy "store_sync_jobs_update_admin_only"
on public.store_sync_jobs
for all
using (public.is_admin())
with check (public.is_admin());

create policy "webhook_ingestion_records_select_admin_only"
on public.webhook_ingestion_records
for select
using (public.is_admin());

create policy "webhook_ingestion_records_insert_admin_only"
on public.webhook_ingestion_records
for insert
with check (public.is_admin());

create policy "webhook_ingestion_records_update_admin_only"
on public.webhook_ingestion_records
for update
using (public.is_admin())
with check (public.is_admin());

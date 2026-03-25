-- Demo-friendly seed data for Supabase.
-- If you create real Supabase Auth users, update `auth_user_id` on the matching profiles.

insert into public.profiles (id, auth_user_id, role, full_name, email, country)
values
  ('11111111-1111-1111-1111-111111111111', null, 'ADMIN', 'Ari Bennett', 'admin@affinity-demo.com', 'United States'),
  ('22222222-2222-2222-2222-222222222222', null, 'INFLUENCER', 'Luna Voss', 'luna@affinity-demo.com', 'United Kingdom'),
  ('33333333-3333-3333-3333-333333333333', null, 'INFLUENCER', 'Nico Hart', 'nico@affinity-demo.com', 'Italy')
on conflict do nothing;

insert into public.influencer_applications (
  id,
  profile_id,
  full_name,
  email,
  instagram_handle,
  tiktok_handle,
  youtube_handle,
  primary_platform,
  audience_size,
  country,
  niche,
  message,
  consent_accepted,
  status,
  reviewed_by,
  reviewed_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Luna Voss',
    'luna@affinity-demo.com',
    'lunavoss',
    'lunaedits',
    null,
    'instagram',
    '25k-100k',
    'United Kingdom',
    'Lifestyle',
    'I create polished brand-first content for modern DTC products.',
    true,
    'approved',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '12 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'Nico Hart',
    'nico@affinity-demo.com',
    'nicohartstudio',
    null,
    'NicoHartStudio',
    'youtube',
    '10k-25k',
    'Italy',
    'Tech',
    'I run desk setup and creator software reviews with high buying intent.',
    true,
    'approved',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '8 days'
  )
on conflict do nothing;

insert into public.influencers (
  id,
  profile_id,
  application_id,
  public_slug,
  discount_code,
  commission_type,
  commission_value,
  is_active,
  payout_method,
  payout_email,
  notes
)
values
  (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'luna-voss',
    'LUNAVOSS10',
    'percentage',
    15,
    true,
    'paypal',
    'luna@affinity-demo.com',
    'Seed creator'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'nico-hart',
    'NICOHART10',
    'percentage',
    15,
    true,
    'bank_transfer',
    'nico@affinity-demo.com',
    'Seed creator'
  )
on conflict do nothing;

insert into public.referral_links (id, influencer_id, code, destination_url, is_primary)
values
  (
    '66666666-6666-6666-6666-666666666666',
    '44444444-4444-4444-4444-444444444444',
    'luna-voss',
    'http://localhost:3000/shop?ref=luna-voss',
    true
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    '55555555-5555-5555-5555-555555555555',
    'nico-hart',
    'http://localhost:3000/shop?ref=nico-hart',
    true
  )
on conflict do nothing;

insert into public.promo_assets (id, title, type, file_url, description, is_active)
values
  (
    '88888888-8888-8888-8888-888888888888',
    'Launch Kit',
    'image',
    'https://example.com/assets/launch-kit.zip',
    'Static story cards, square posts, and launch covers.',
    true
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'Brand Messaging Angles',
    'copy',
    'https://example.com/assets/messaging-angles.pdf',
    'Approved hooks, positioning, and CTA angles.',
    true
  )
on conflict do nothing;

insert into public.influencer_asset_access (id, influencer_id, asset_id)
values
  ('12121212-1212-1212-1212-121212121212', '44444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888'),
  ('13131313-1313-1313-1313-131313131313', '44444444-4444-4444-4444-444444444444', '99999999-9999-9999-9999-999999999999'),
  ('14141414-1414-1414-1414-141414141414', '55555555-5555-5555-5555-555555555555', '88888888-8888-8888-8888-888888888888')
on conflict do nothing;

insert into public.link_clicks (id, influencer_id, referral_link_id, visitor_id, referrer, user_agent, ip_hash)
values
  ('15151515-1515-1515-1515-151515151515', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'visitor_1', 'https://instagram.com', 'Mozilla/5.0', 'seedhash1'),
  ('16161616-1616-1616-1616-161616161616', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'visitor_2', 'https://instagram.com', 'Mozilla/5.0', 'seedhash2'),
  ('17171717-1717-1717-1717-171717171717', '55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', 'visitor_3', 'https://youtube.com', 'Mozilla/5.0', 'seedhash3')
on conflict do nothing;

insert into public.conversions (
  id,
  influencer_id,
  referral_link_id,
  order_id,
  customer_email,
  order_amount,
  currency,
  commission_type,
  commission_value,
  commission_amount,
  status
)
values
  (
    '18181818-1818-1818-1818-181818181818',
    '44444444-4444-4444-4444-444444444444',
    '66666666-6666-6666-6666-666666666666',
    'ORD-1001',
    'customer1@example.com',
    180.00,
    'USD',
    'percentage',
    15,
    27.00,
    'approved'
  ),
  (
    '19191919-1919-1919-1919-191919191919',
    '55555555-5555-5555-5555-555555555555',
    '77777777-7777-7777-7777-777777777777',
    'ORD-1002',
    'customer2@example.com',
    240.00,
    'USD',
    'percentage',
    15,
    36.00,
    'paid'
  )
on conflict do nothing;

insert into public.payouts (id, influencer_id, amount, currency, status, method, reference, paid_at)
values
  (
    '20202020-2020-2020-2020-202020202020',
    '55555555-5555-5555-5555-555555555555',
    36.00,
    'USD',
    'paid',
    'bank_transfer',
    'PAYOUT-NICO-001',
    now() - interval '2 days'
  )
on conflict do nothing;

update public.program_settings
set
  allow_affiliate_code_generation = true,
  allow_promo_code_requests = true,
  allow_custom_link_destinations = true,
  promo_code_prefix = 'AFF',
  email_brand_name = 'Affinity',
  email_reply_to = 'partners@affinity-demo.com',
  anti_leak_enabled = true,
  block_self_referrals = true,
  require_code_ownership_match = true,
  fraud_review_enabled = true,
  max_clicks_per_ip_per_day = 6,
  max_conversions_per_ip_per_day = 2,
  enable_rewards = true,
  enable_store_credit = true,
  enable_marketplace = false,
  enable_multi_level = false,
  enable_multi_program = false,
  enable_auto_payouts = false,
  allowed_destination_urls = array[
    'http://localhost:3000/shop',
    'http://localhost:3000/shop?collection=best-sellers',
    'http://localhost:3000/shop?collection=new-arrivals'
  ];

update public.referral_links
set
  name = case
    when code = 'luna-voss' then 'Primary storefront link'
    when code = 'nico-hart' then 'Primary storefront link'
    else name
  end,
  is_active = true,
  archived_at = null
where id in (
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777'
);

insert into public.campaigns (
  id,
  name,
  description,
  landing_url,
  start_date,
  end_date,
  status,
  commission_type,
  commission_value,
  bonus_title,
  bonus_description,
  bonus_type,
  bonus_value,
  applies_to_all,
  affiliate_ids
)
values
  (
    '21212121-2121-2121-2121-212121212121',
    'Holiday Drop Push',
    'Seasonal storefront push aligned to gifting bundles and premium high-intent traffic.',
    'http://localhost:3000/shop?collection=best-sellers',
    now() - interval '10 days',
    now() + interval '21 days',
    'active',
    'percentage',
    18,
    'Holiday revenue booster',
    'Cash bonus for affiliates crossing the gifting revenue threshold.',
    'cash_bonus',
    150,
    true,
    '{}'::uuid[]
  ),
  (
    '22222222-aaaa-bbbb-cccc-222222222222',
    'Creator Studio Essentials',
    'Desk setup and creator workflow campaign for educational content and comparison hooks.',
    'http://localhost:3000/shop?collection=new-arrivals',
    now() - interval '20 days',
    now() + interval '14 days',
    'active',
    null,
    null,
    'Desk setup sample kit',
    'Gifted creator kit for long-form creator workflow content.',
    'gift',
    null,
    false,
    array[
      '44444444-4444-4444-4444-444444444444'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid
    ]
  )
on conflict do nothing;

insert into public.promo_codes (
  id,
  influencer_id,
  campaign_id,
  code,
  discount_value,
  status,
  source,
  is_primary,
  request_message,
  approved_by
)
values
  (
    '23232323-2323-2323-2323-232323232323',
    '44444444-4444-4444-4444-444444444444',
    null,
    'LUNAVOSS10',
    10,
    'active',
    'assigned',
    true,
    null,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    '24242424-2424-2424-2424-242424242424',
    '55555555-5555-5555-5555-555555555555',
    null,
    'NICOHART10',
    10,
    'active',
    'assigned',
    true,
    null,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    '25252525-2525-2525-2525-252525252525',
    '44444444-4444-4444-4444-444444444444',
    '21212121-2121-2121-2121-212121212121',
    'AFF-LUNA-HOLIDAY',
    12,
    'pending',
    'requested',
    false,
    'Need a campaign-specific code for the holiday drop.',
    null
  )
on conflict do nothing;

update public.conversions
set
  promo_code_id = case
    when id = '18181818-1818-1818-1818-181818181818' then '23232323-2323-2323-2323-232323232323'::uuid
    when id = '19191919-1919-1919-1919-191919191919' then '24242424-2424-2424-2424-242424242424'::uuid
    else promo_code_id
  end,
  attribution_source = case
    when id = '18181818-1818-1818-1818-181818181818' then 'hybrid'::public.attribution_source
    when id = '19191919-1919-1919-1919-191919191919' then 'promo_code'::public.attribution_source
    else attribution_source
  end
where id in (
  '18181818-1818-1818-1818-181818181818',
  '19191919-1919-1919-1919-191919191919'
);

insert into public.payout_allocations (
  id,
  payout_id,
  conversion_id,
  influencer_id,
  amount
)
values
  (
    '26262626-2626-2626-2626-262626262626',
    '20202020-2020-2020-2020-202020202020',
    '19191919-1919-1919-1919-191919191919',
    '55555555-5555-5555-5555-555555555555',
    36.00
  )
on conflict do nothing;

insert into public.rewards (
  id,
  influencer_id,
  campaign_id,
  type,
  title,
  description,
  value,
  currency,
  status
)
values
  (
    '27272727-2727-2727-2727-272727272727',
    null,
    '21212121-2121-2121-2121-212121212121',
    'cash_bonus',
    'Holiday revenue booster',
    'Cash bonus for affiliates crossing the gifting threshold during the holiday campaign.',
    150,
    'USD',
    'earned'
  )
on conflict do nothing;

insert into public.suspicious_events (
  id,
  influencer_id,
  referral_link_id,
  promo_code_id,
  conversion_id,
  type,
  severity,
  status,
  title,
  detail
)
values
  (
    '28282828-2828-2828-2828-282828282828',
    '44444444-4444-4444-4444-444444444444',
    '66666666-6666-6666-6666-666666666666',
    '23232323-2323-2323-2323-232323232323',
    '18181818-1818-1818-1818-181818181818',
    'self_referral',
    'high',
    'open',
    'Possible self-referral order',
    'Customer email matches the affiliate account email on a commissionable order.'
  )
on conflict do nothing;

insert into public.store_connections (
  id,
  owner_profile_id,
  platform,
  store_name,
  shop_domain,
  storefront_url,
  default_destination_url,
  install_state,
  status,
  connection_health,
  sync_products_enabled,
  sync_discount_codes_enabled,
  order_attribution_enabled,
  auto_create_discount_codes,
  app_embed_enabled,
  required_scopes,
  granted_scopes,
  installed_at,
  connected_at,
  last_health_check_at,
  last_health_error,
  last_products_sync_at,
  last_discount_sync_at,
  last_orders_sync_at,
  last_webhook_at,
  products_synced_count,
  collections_synced_count,
  discounts_synced_count
)
values
  (
    '29292929-2929-2929-2929-292929292929',
    '11111111-1111-1111-1111-111111111111',
    'shopify',
    'Affinity Demo Store',
    'affinity-demo.myshopify.com',
    'http://localhost:3000/shop',
    'http://localhost:3000/shop',
    'installed',
    'connected',
    'warning',
    true,
    true,
    true,
    true,
    true,
    array['read_products', 'read_content', 'read_discounts', 'write_discounts', 'read_orders'],
    array['read_products', 'read_content', 'read_discounts', 'write_discounts', 'read_orders'],
    now() - interval '30 days',
    now() - interval '29 days',
    now() - interval '1 day',
    'One webhook event still needs retry after an attribution mismatch.',
    now() - interval '1 day',
    now() - interval '1 day',
    now() - interval '12 hours',
    now() - interval '6 hours',
    2,
    0,
    2
  )
on conflict do nothing;

insert into public.store_catalog_items (
  id,
  connection_id,
  shopify_resource_id,
  title,
  type,
  handle,
  destination_url,
  is_affiliate_enabled,
  is_featured
)
values
  (
    '30303030-3030-3030-3030-303030303030',
    '29292929-2929-2929-2929-292929292929',
    'gid://shopify/Product/1001',
    'Luma Desk Lamp',
    'product',
    'luma-desk-lamp',
    'http://localhost:3000/shop/products/luma-desk-lamp',
    true,
    true
  ),
  (
    '31313131-3131-3131-3131-313131313131',
    '29292929-2929-2929-2929-292929292929',
    'gid://shopify/Collection/1002',
    'Best sellers',
    'collection',
    'best-sellers',
    'http://localhost:3000/shop?collection=best-sellers',
    true,
    false
  )
on conflict do nothing;

insert into public.store_sync_jobs (
  id,
  connection_id,
  type,
  mode,
  status,
  source_of_truth,
  triggered_by,
  requested_by,
  notes,
  records_processed,
  records_created,
  requested_at,
  started_at,
  completed_at
)
values
  (
    '32323232-3232-3232-3232-323232323232',
    '29292929-2929-2929-2929-292929292929',
    'products',
    'full',
    'succeeded',
    'shopify',
    'merchant',
    '11111111-1111-1111-1111-111111111111',
    'Initial catalog sync after store connection.',
    2,
    2,
    now() - interval '1 day',
    now() - interval '1 day',
    now() - interval '1 day'
  )
on conflict do nothing;

insert into public.webhook_ingestion_records (
  id,
  connection_id,
  topic,
  shop_domain,
  external_event_id,
  idempotency_key,
  status,
  attempts,
  error_message,
  order_id,
  referral_code,
  discount_code,
  influencer_id,
  conversion_id,
  payload_summary,
  raw_payload,
  headers,
  hmac_valid,
  received_at,
  processed_at,
  last_attempt_at
)
values
  (
    '33333333-4444-5555-6666-777777777777',
    '29292929-2929-2929-2929-292929292929',
    'orders/paid',
    'affinity-demo.myshopify.com',
    'evt_shopify_order_paid_1001',
    'seed_evt_shopify_order_paid_1001',
    'failed',
    1,
    'Referral code and discount code point to different affiliates.',
    'SHOP-1002',
    'luna-voss',
    'NICOHART10',
    null,
    null,
    '{"orderAmount": 146, "currency": "USD", "attributionSource": "hybrid"}'::jsonb,
    '{"id": "SHOP-1002"}'::jsonb,
    '{"shop_domain": "affinity-demo.myshopify.com"}'::jsonb,
    true,
    now() - interval '6 hours',
    null,
    now() - interval '6 hours'
  )
on conflict do nothing;

# Shopify App Setup

Affinity usa un bridge Shopify server-side gia presente nel codice:

- install route: `/api/shopify/install`
- callback route: `/api/shopify/callback`
- webhook endpoint: `/api/webhooks/shopify`
- token exchange e persistenza store: `src/lib/shopify-bridge.ts`

## Stato architetturale

Il progetto oggi usa un flusso OAuth server-side classico con token persistito lato backend.
Per questo motivo il setup CLI proposto mantiene `embedded = false` e `use_legacy_install_flow = true`.
Attivare `embedded = true` senza App Bridge e session token introdurrebbe una finta integrazione invece di una integrazione reale.

## Variabili ambiente richieste

Imposta in `.env.local` o nelle env del provider di hosting:

```bash
NEXT_PUBLIC_APP_URL=https://affliateup.netlify.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_WEBHOOK_SECRET=...
SHOPIFY_TOKEN_ENCRYPTION_KEY=...
SHOPIFY_SCOPES=read_products,read_content,read_discounts,write_discounts,read_orders

SHOPIFY_APP_NAME=Affinity
SHOPIFY_APP_HANDLE=affinity
SHOPIFY_APP_EMBEDDED=false
SHOPIFY_USE_LEGACY_INSTALL_FLOW=true
SHOPIFY_DEV_STORE_URL=your-dev-store.myshopify.com
SHOPIFY_CLI_AUTO_UPDATE_URLS=true
SHOPIFY_WEBHOOK_URI=/api/webhooks/shopify
```

Per sviluppo locale puoi temporaneamente usare `http://localhost:3000`, ma il file di configurazione Shopify che vuoi distribuire deve sempre essere generato con l'URL HTTPS pubblico definitivo.

## Generazione config CLI

Genera `shopify.app.toml` dal repository:

```bash
npm run shopify:config
```

Poi avvia lo sviluppo con Shopify CLI:

```bash
npm run shopify:dev
```

Quando la configurazione e pronta per la release:

```bash
npm run shopify:deploy
```

## Cosa verifica la configurazione generata

- `application_url` allineato a `NEXT_PUBLIC_APP_URL`
- `redirect_urls` allineati a `/api/shopify/callback`
- scope letti da `SHOPIFY_SCOPES`
- webhook subscription verso `/api/webhooks/shopify`
- configurazione coerente con l'attuale auth flow server-side

## Theme app extension per tracking storefront

Il repository include anche una theme app extension reale:

- `extensions/affinity-referral-tracker/shopify.extension.toml`
- block embed: `blocks/referral-tracker-embed.liquid`
- asset JS: `assets/affinity-referral-tracker.js`

Questa estensione:

- legge il parametro `ref` sulla storefront Shopify
- lo persiste in cookie e localStorage lato store
- lo scrive negli attributi del carrello come `affiliate_ref` e `affiliate_landing`
- consente ai webhook ordine di recuperare il referral anche dopo il checkout

Per una installazione live devi quindi:

1. distribuire l'app Shopify con `npm run shopify:deploy`
2. installarla sullo store merchant
3. aprire il theme editor Shopify
4. abilitare l'app embed `Affinity Referral Tracker`
5. pubblicare il tema

## Flusso reale merchant -> Shopify

Con env completi e app pubblicata, il flusso previsto e questo:

1. il merchant apre `/api/shopify/install?shop=nome-store.myshopify.com`
2. Shopify autorizza l'app e rimanda a `/api/shopify/callback`
3. `src/lib/shopify-bridge.ts` scambia il code con l'access token
4. la connessione viene salvata in `store_connections`
5. il catalogo puo essere sincronizzato e i webhook ordini possono generare attribuzioni reali
6. l'area merchant legge lo store collegato tramite `owner_profile_id`

## Persistenza merchant-store

La connessione Shopify viene salvata in `store_connections` con:

- `owner_profile_id`
- `shop_domain`
- `store_name`
- `storefront_url`
- token cifrato lato backend

Le viste merchant e i job store sono ora risolti per `owner_profile_id`, non piu sulla "ultima connessione globale".

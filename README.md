# Affinity

Affinity e una piattaforma SaaS per affiliate operations costruita con Next.js App Router, TypeScript, Tailwind CSS v4 e Supabase, con integrazione Shopify server-side gia predisposta nel prodotto.

Produzione prevista: [https://affiliateelevia.netlify.app](https://affiliateelevia.netlify.app)

## Cosa include

- area merchant con store ops, candidature, affiliati, campagne, codici promo, commissioni e payout
- portale partner con link, codici, campagne, asset, guadagni e impostazioni account
- tracking referral su `/r/[slug]`
- bridge Shopify con install route, callback OAuth, webhook intake e persistenza connessione store
- seed data credibili per sviluppo locale senza esposizione di credenziali in UI

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase Auth + Postgres
- React Hook Form + Zod
- Resend
- Shopify CLI

## Avvio locale

```bash
npm install
cp .env.example .env.local
# per sviluppo locale puoi sostituire NEXT_PUBLIC_APP_URL con http://localhost:3000
# l'esempio parte in NEXT_PUBLIC_DEMO_MODE=true per bootstrap locale immediato
# passa a NEXT_PUBLIC_DEMO_MODE=false solo dopo aver configurato Supabase
npm run dev
```

Apri poi [http://localhost:3000](http://localhost:3000).

Se attivi esplicitamente `NEXT_PUBLIC_DEMO_MODE=true`, il prodotto usa il repository locale di sviluppo con seed data persistiti in `data/demo-db.json`. Gli account di sviluppo restano tecnici e non vengono esposti direttamente nella UI.

## Script utili

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm run shopify:config
npm run shopify:dev
npm run shopify:deploy
```

## Supabase

Applica le migration nell'ordine:

```bash
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_shopify_store_ops.sql
supabase/migrations/0003_affiliate_ops_expansion.sql
supabase/migrations/0004_affiliate_invites.sql
```

Per popolare un ambiente reale di test puoi usare `supabase/seed.sql`.

## Shopify

La configurazione Shopify CLI e documentata in [docs/shopify-app-setup.md](./docs/shopify-app-setup.md).

In breve:

1. imposta le variabili `SHOPIFY_*` e `NEXT_PUBLIC_APP_URL`
2. genera `shopify.app.toml` con `npm run shopify:config`
3. avvia `npm run shopify:dev` oppure distribuisci con `npm run shopify:deploy`

L'attuale setup usa `embedded = false` e `use_legacy_install_flow = true`, in coerenza con il bridge OAuth server-side gia implementato nel repository.
Il tracking storefront Shopify e supportato anche tramite theme app extension in `extensions/affinity-referral-tracker`.
`SHOPIFY_WEBHOOK_SECRET` non e obbligatoria: se non la imposti, il progetto verifica le webhook con `SHOPIFY_API_SECRET`, che e il comportamento standard Shopify.
La chiave Supabase "Publishable key" va inserita in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Verifica locale

I controlli principali previsti dal progetto sono:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

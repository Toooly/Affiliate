import Link from "next/link";

import {
  Link2,
  ShieldCheck,
  Store,
  TicketPercent,
  Users,
  Wallet,
  Waypoints,
} from "lucide-react";

import { AccessPanel } from "@/components/home/access-panel";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isDemoMode } from "@/lib/env";

export default function Home() {
  const showQuickFill = isDemoMode();

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 py-5 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo withTagline />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Logica stile UpPromote, operativita piu pulita</Badge>
            <Badge variant="secondary">Ruoli e accessi distinti</Badge>
            <Badge variant="outline">Architettura pronta per Shopify</Badge>
          </div>
        </div>

        <section className="grid gap-8 py-12 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] xl:py-16">
          <Card className="ui-card-hero overflow-hidden rounded-[36px]">
            <CardContent className="p-7 md:p-9 xl:p-11">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Cabina di regia admin / gestore</Badge>
                <Badge variant="outline">Portale affiliato personale</Badge>
                <Badge variant="outline">Auth separata per ruolo</Badge>
              </div>

              <h1 className="mt-7 max-w-4xl font-display text-5xl font-semibold tracking-tight md:text-6xl xl:text-[4.9rem]">
                Un&apos;unica piattaforma, due aree operative chiaramente distinte.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Affinity separa in modo netto l&apos;area admin, dove controlli affiliati,
                campagne, payout e store ops, dall&apos;area affiliato, dove ogni partner
                lavora solo sul proprio profilo, sui propri link e sulle proprie performance.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login/admin">Accedi come admin / gestore</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login/affiliate">Accedi come affiliato</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/apply">Richiedi l&apos;accesso affiliato</Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    label: "Area Admin / Gestore",
                    value: "Controllo globale di affiliati, commissioni, campagne e payout.",
                  },
                  {
                    label: "Area Affiliato",
                    value: "Accesso personale a link, codici promo, campagne e guadagni.",
                  },
                  {
                    label: "Routing ruoli",
                    value: "Ogni login entra solo nell'area coerente con il proprio ruolo.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="ui-panel-block ui-panel-block-strong rounded-[28px] p-5"
                  >
                    <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      {item.label}
                    </div>
                    <div className="mt-3 text-base font-semibold leading-7">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="surface-neutral rounded-[34px]">
              <CardContent className="p-6 md:p-7 xl:p-8">
                <div className="ui-surface-overline">
                  Cosa contiene il prodotto
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    {
                      icon: Store,
                      title: "Store ops e sincronizzazioni",
                      detail: "Installazione Shopify, scope, governance catalogo, webhook e salute connessione.",
                    },
                    {
                      icon: Users,
                      title: "Gestione affiliati",
                      detail: "Revisione candidature, attivazione partner, note interne e controllo del profilo.",
                    },
                    {
                      icon: Link2,
                      title: "Link e codici promo",
                      detail: "Routing tracciato, ownership dei codici, assegnazione campagna e approvazioni.",
                    },
                    {
                      icon: Wallet,
                      title: "Ledger e payout",
                      detail: "Commissioni, allocazioni, batch payout e visibilita completa sullo stato finanziario.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="ui-surface-panel flex items-start gap-4 p-4"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-[18px] bg-[color:var(--surface-overlay)]">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="mt-1 text-sm leading-6 text-[color:var(--surface-copy)]">
                          {item.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: TicketPercent,
                  title: "Accessi chiari",
                  detail: "Ingresso admin e ingresso affiliato sono separati e riconoscibili al primo colpo d'occhio.",
                },
                {
                  icon: Waypoints,
                  title: "Ruoli separati",
                  detail: "L'affiliato vede solo la propria area personale; l'admin controlla tutto il programma.",
                },
                {
                  icon: ShieldCheck,
                  title: "Routing coerente",
                  detail: "Il sistema indirizza il login verso la sezione giusta ed evita accessi ambigui nel pannello sbagliato.",
                },
                {
                  icon: Wallet,
                  title: "Esperienza piu leggibile",
                  detail: "Blocchi piu distanziati, gerarchia visiva piu netta e CTA piu evidenti su desktop e mobile.",
                },
              ].map((item) => (
                <Card key={item.title} className="rounded-[30px]">
                  <CardContent className="p-5">
                    <div className="ui-icon-chip flex size-11 items-center justify-center rounded-[18px]">
                      <item.icon className="size-5" />
                    </div>
                    <div className="mt-4 font-semibold">{item.title}</div>
                    <div className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.detail}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="ui-card-stage rounded-[40px] px-5 py-8 md:px-7 md:py-10 xl:px-10 xl:py-12">
          <div className="max-w-3xl">
            <Badge variant="default">Scegli subito la tua area</Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-[2.35rem]">
              Due accessi distinti, due contesti d&apos;uso diversi, una sola logica di prodotto.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Qui sotto trovi due ingressi separati: uno per chi gestisce il programma affiliate
              nel suo insieme, uno per il singolo affiliato che accede soltanto alla propria area.
            </p>
          </div>

          <div className="mt-8 grid gap-8">
            <AccessPanel
              workspace="merchant"
              tone="dark"
              icon={Store}
              badge="Area Admin / Gestore"
              title="Controllo globale del programma affiliate"
              description="Questa e l'area riservata a chi supervisiona tutti gli affiliati, approva candidature, assegna codici, controlla payout e tiene sotto controllo lo store Shopify."
              audience="Accesso riservato a chi gestisce il programma e ha visibilita completa su tutti gli affiliati."
              highlights={[
                "Rivedi candidature, attiva partner e governa codici promo e referral link.",
                "Monitora conversioni, liability, payout e anomalie senza uscire dal backoffice.",
                "Controlla store ops, sincronizzazioni Shopify, webhooks e regole globali del programma.",
              ]}
              loginTitle="Login admin / gestore"
              loginHint="Inserisci le credenziali dell'area di controllo globale. Se usi la demo, puoi riempire il form con un click."
              primaryHref="/login/admin"
              primaryLabel="Apri pagina login admin"
              showQuickFill={showQuickFill}
            />

            <AccessPanel
              workspace="affiliate"
              tone="light"
              icon={Users}
              badge="Area Affiliato"
              title="Accesso personale del singolo affiliato"
              description="Questa e l'area personale del partner: qui ogni affiliato gestisce i propri link, i propri codici promo, le campagne disponibili e il proprio storico guadagni."
              audience="Accesso personale, limitato ai dati e agli strumenti del singolo affiliato."
              highlights={[
                "Genera e copia referral link, monitora click e performance e gestisci i tuoi codici promo.",
                "Consulta campagne attive, materiali creativi, payout e impostazioni personali.",
                "Mantieni separata la tua area dall'operativita admin, senza confusione tra ruoli.",
              ]}
              loginTitle="Login affiliato"
              loginHint="Accedi con il tuo account affiliato per entrare solo nel tuo portale personale. Se devi ancora entrare nel programma, richiedi prima l'accesso."
              primaryHref="/login/affiliate"
              primaryLabel="Apri pagina login affiliato"
              secondaryHref="/apply"
              secondaryLabel="Richiedi accesso affiliato"
              showQuickFill={showQuickFill}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

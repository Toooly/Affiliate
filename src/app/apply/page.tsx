import Link from "next/link";
import type { Metadata } from "next";

import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { ApplicationForm } from "@/components/forms/application-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Candidatura affiliato | Affinity",
  description:
    "Invia la candidatura per entrare nel programma affiliate e accedere al portale partner di Affinity.",
};

const reviewSteps = [
  {
    title: "Invii profilo, canali e contesto editoriale",
    detail: "Raccogliamo identita, audience, piattaforme e motivazione per valutare il fit con il programma.",
  },
  {
    title: "Il team merchant revisiona la richiesta",
    detail: "La candidatura entra in review prima di sbloccare dashboard, codici promo e accesso operativo.",
  },
  {
    title: "Ricevi esito e attivazione del portale",
    detail: "Quando il profilo viene approvato, le credenziali restano gia associate al tuo account partner.",
  },
];

export default function ApplyPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login/affiliate">Login affiliato</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Torna alla home
          </Link>
        </Button>
      </PublicHeader>

      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-16 pt-4 lg:px-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)]">
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Partner application</Badge>
              <Badge variant="outline">Manual review</Badge>
            </div>
            <h1 className="ui-page-title-hero max-w-3xl">
              Richiedi l&apos;accesso al programma partner con un onboarding serio e approvativo.
            </h1>
            <p className="ui-page-copy max-w-2xl">
              Questa pagina serve a presentare il profilo partner al team merchant, non a
              entrare subito in dashboard. Dopo l&apos;invio, la richiesta passa in revisione e
              l&apos;accesso si attiva solo quando il profilo viene approvato.
            </p>
          </div>

          <Card className="surface-neutral overflow-hidden rounded-[32px]">
            <CardContent className="p-6">
              <Badge variant="surface">Cosa succede dopo l&apos;invio</Badge>
              <div className="mt-5 grid gap-3">
                {reviewSteps.map((item, index) => (
                  <div key={item.title} className="ui-surface-panel rounded-[24px] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--surface-copy)]">
                        Step {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--surface-foreground)]">
                          {item.title}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--surface-copy)]">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px]">
            <CardContent className="p-5">
              <div className="ui-page-overline text-muted-foreground">Segnali di fiducia</div>
              <div className="mt-4 grid gap-3">
                {[
                  "La candidatura viene revisionata prima di attivare dashboard e codice promo.",
                  "La password che imposti serve come credenziale iniziale del futuro portale partner.",
                  "Lo stato della richiesta resta visibile al login finche la review non si chiude.",
                ].map((item) => (
                  <div key={item} className="ui-soft-block ui-soft-block-strong rounded-[22px] p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <Card className="rounded-[32px]">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="ui-page-overline text-muted-foreground">Candidatura affiliato</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    Invia il tuo profilo partner
                  </div>
                </div>
                <Badge variant="outline">Review required</Badge>
              </div>

              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Compila il profilo in modo completo: il team usa queste informazioni per valutare
                audience, canali, nicchia e fit con il programma.
              </p>

              <ApplicationForm />
            </CardContent>
          </Card>

          <Card className="rounded-[30px]">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="font-semibold">Hai gia un account partner?</div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Se il profilo e gia stato approvato, puoi entrare direttamente nel portale affiliato.
                </p>
              </div>
              <Button asChild size="lg" variant="outline">
                <Link href="/login/affiliate">
                  Vai al login affiliato
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-[28px] border border-border/80 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-foreground" />
              <p>
                Dopo l&apos;invio riceverai una conferma e potrai controllare lo stato della richiesta
                dallo stesso percorso di accesso affiliato.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

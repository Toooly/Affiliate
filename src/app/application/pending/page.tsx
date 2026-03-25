import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRight, Clock3, MailCheck, ShieldAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";

export default async function PendingApplicationPage() {
  const session = await getCurrentSession();
  const status = session
    ? await getRepository().getApplicationStatusForProfile(session.profileId)
    : null;

  if (status === "approved") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[900px] items-center justify-between px-4 py-5 lg:px-6">
        <Logo withTagline />
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Torna alla home</Link>
        </Button>
      </div>

      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 pb-16 pt-6 lg:px-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Stato candidatura</CardTitle>
              {status ? <StatusBadge status={status} /> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "rejected" ? (
              <div className="rounded-[28px] border border-border/80 bg-muted/65 p-6">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="size-5 text-foreground" />
                  <div className="font-medium">Candidatura non approvata</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Questo account non e attivo per l&apos;attuale gruppo creator. Puoi comunque ricontattare il team se il tuo pubblico o il tuo focus contenutistico cambiano.
                </p>
              </div>
            ) : (
              <div className="rounded-[28px] border border-border/80 bg-muted/65 p-6">
                <div className="flex items-center gap-3">
                  <Clock3 className="size-5 text-foreground" />
                  <div className="font-medium">Revisione in corso</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Il tuo account creator e ancora in revisione. Una volta approvato, riceverai il tuo codice promo, il referral link e l&apos;accesso alla dashboard.
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "1. Valutiamo il profilo",
                  text: "Il team controlla audience, mix di piattaforme e coerenza con la nicchia.",
                },
                {
                  title: "2. Attiviamo l&apos;account",
                  text: "L&apos;approvazione genera il tuo codice personale, lo slug referral e l&apos;accesso alla dashboard.",
                },
                {
                  title: "3. Ricevi una mail",
                  text: "Ti inviamo l&apos;esito e le istruzioni di accesso con lo stesso flusso branded.",
                },
              ].map((item) => (
                <Card key={item.title} className="bg-background/76">
                  <CardContent className="p-5">
                    <div className="font-medium">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-secondary/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <MailCheck className="size-5 text-foreground" />
                    <div className="font-medium">Controlla la tua inbox</div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Inviamo mail di conferma, approvazione e rifiuto con lo stesso flusso del brand.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/60">
                <CardContent className="p-5">
                  <div className="font-medium">Vuoi cambiare account?</div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Usa il login demo oppure torna alla landing per candidarti con un&apos;altra email creator.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login/affiliate">
                  Vai al login
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/apply">Invia una nuova candidatura</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}




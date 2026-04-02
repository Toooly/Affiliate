import Link from "next/link";
import type { Metadata } from "next";

import { ArrowLeft, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";

import { AffiliateRegistrationForm } from "@/components/forms/affiliate-registration-form";
import { PublicHeader } from "@/components/public/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { formatShortDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Registrazione affiliato | Affinity",
  description:
    "Crea un account affiliato e accedi al portale partner con stato di revisione coerente.",
};

type RegisterPageProps = {
  searchParams?: Promise<{
    invite?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const inviteToken = params.invite?.trim() || null;
  const invite = inviteToken
    ? await getRepository().getAffiliateInviteByToken(inviteToken)
    : null;
  const hasInvite = Boolean(inviteToken);
  const invalidInvite = hasInvite && !invite;
  const unavailableInvite = invite && !invite.isClaimable;

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

      <main className="mx-auto grid w-full max-w-[1120px] gap-6 px-4 pb-16 pt-4 lg:px-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {hasInvite ? "Invito affiliato" : "Registrazione affiliato"}
              </Badge>
              <Badge variant="outline">Accesso partner</Badge>
            </div>
            <h1 className="ui-page-title-hero max-w-3xl">
              {invalidInvite
                ? "Questo link invito non e disponibile."
                : hasInvite
                  ? "Attiva il tuo account affiliato dal link invito."
                  : "Crea il tuo account affiliato e accedi al portale partner."}
            </h1>
            <p className="ui-page-copy max-w-2xl">
              {invalidInvite
                ? "Il token di registrazione non e valido oppure non e piu disponibile. Se ti aspettavi un invito attivo, chiedi al merchant di generare un nuovo link."
                : hasInvite
                  ? "Questo invito collega direttamente la registrazione al programma corretto. Una volta completato il form, il profilo partner viene creato con i permessi e le regole previste dall'invito."
                  : "La registrazione crea davvero il tuo account come affiliato. Se il profilo e ancora in revisione, accederai subito alla pagina di stato finche il team non approva l'attivazione completa."}
            </p>
          </div>

          <Card className="surface-neutral overflow-hidden rounded-[32px]">
            <CardContent className="p-6">
              <Badge variant="surface">
                {hasInvite ? "Dettagli invito" : "Cosa succede dopo la registrazione"}
              </Badge>
              <div className="mt-5 grid gap-3">
                {(invalidInvite
                  ? [
                      "Il token non puo essere usato per completare una registrazione.",
                      "Richiedi un nuovo link invito al merchant che gestisce il programma.",
                      "Puoi comunque usare il login affiliato se possiedi gia un account attivo.",
                    ]
                  : hasInvite
                    ? [
                        invite?.campaignName
                          ? `Programma collegato: ${invite.campaignName}.`
                          : "L'invito ti collega subito al programma affiliato corretto.",
                        invite?.commissionType === "percentage"
                          ? `Commissione iniziale prevista: ${invite?.commissionValue}% sulle vendite attribuite.`
                          : `Commissione iniziale prevista: ${invite?.commissionValue} fissa per conversione.`,
                        invite?.expiresAt
                          ? `Link valido fino al ${formatShortDate(invite.expiresAt)}.`
                          : "Il merchant ha generato un onboarding partner dedicato per questo account.",
                      ]
                    : [
                        "L'account viene creato subito con ruolo affiliato, non admin.",
                        "Le credenziali funzionano immediatamente per il login dell'area affiliato.",
                        "Finche il profilo non viene approvato, il sistema mostra lo stato di revisione.",
                      ]).map((item) => (
                  <div key={item} className="ui-surface-panel rounded-[24px] px-4 py-4">
                    <div className="flex items-start gap-3">
                      {invalidInvite ? (
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[color:var(--surface-copy)]" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--surface-copy)]" />
                      )}
                      <p className="text-sm leading-6 text-[color:var(--surface-copy)]">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px]">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="ui-icon-chip flex size-11 items-center justify-center rounded-[18px]">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="font-semibold">Registrazione pensata per il portale affiliato</div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    L&apos;admin non ha registrazione pubblica. Questo flusso crea solo account
                    affiliati e mantiene separati ruoli, accessi e redirect.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="rounded-[32px]">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="ui-page-overline text-muted-foreground">Nuovo account affiliato</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    {hasInvite ? "Attivazione account" : "Registrazione"}
                  </div>
                </div>
                <Badge variant="outline">
                  {hasInvite ? "Onboarding guidato" : "Affiliate only"}
                </Badge>
              </div>

              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {invalidInvite
                  ? "Questo invito non puo essere usato per creare un nuovo account."
                  : hasInvite
                    ? "Completa i dati essenziali per attivare il tuo profilo affiliato e aprire subito il portale partner."
                    : "Inserisci solo i dati essenziali per creare il tuo account e iniziare il flusso di attivazione del portale partner."}
              </p>

              {invalidInvite || unavailableInvite ? (
                <div className="ui-notice-warning mt-6 rounded-[24px] px-4 py-4 text-sm leading-6 text-[color:var(--warning-ink)]">
                  {invalidInvite
                    ? "Il link invito non e valido."
                    : "Questo invito e gia stato usato oppure e scaduto."}
                </div>
              ) : (
                <AffiliateRegistrationForm invite={invite} />
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

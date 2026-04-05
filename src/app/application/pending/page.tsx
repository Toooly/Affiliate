import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRight, Clock3, MailCheck, ShieldAlert } from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAffiliateWorkspaceAccess } from "@/lib/auth/session";
import { isResendConfigured } from "@/lib/env";

export default async function PendingApplicationPage() {
  const { accessState } = await requireAffiliateWorkspaceAccess();
  const status = accessState.applicationStatus;
  const emailSenderReady = isResendConfigured();

  if (status === "approved" && accessState.isActive === false) {
    redirect("/application/inactive");
  }

  if (status === "approved") {
    redirect("/dashboard");
  }

  const isRejected = status === "rejected";

  return (
    <div className="min-h-screen">
      <PublicHeader maxWidthClassName="max-w-[980px]">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Torna alla home</Link>
        </Button>
      </PublicHeader>

      <main className="mx-auto ui-page-stack w-full max-w-[980px] px-4 pb-16 pt-4 lg:px-6">
        <section>
          <Card className="ui-card-stage rounded-[34px]">
            <CardContent className="ui-page-stack p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={status ?? "pending"} />
              </div>
              <div>
                <h1 className="ui-page-title-hero max-w-3xl">
                  {isRejected ? "Candidatura non approvata" : "Revisione in corso"}
                </h1>
                <p className="ui-page-copy mt-4 max-w-2xl">
                  {isRejected
                    ? "Il profilo non è stato approvato per l'attuale programma. Puoi comunque presentare una nuova richiesta se il tuo posizionamento o i tuoi canali cambiano."
                    : "La richiesta è stata ricevuta correttamente. Finché la revisione non si chiude, il login affiliato mostra questo stato invece di aprire la dashboard affiliato."}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className={`rounded-[32px] ${isRejected ? "ui-notice-warning" : "ui-notice-success"}`}>
          <CardContent className="flex items-start gap-3 p-5">
            {isRejected ? (
              <ShieldAlert className="mt-0.5 size-5 text-[color:var(--warning-ink)]" />
            ) : (
              <Clock3 className="mt-0.5 size-5 text-[color:var(--success-ink)]" />
            )}
            <div>
              <div
                className={`font-medium ${
                  isRejected ? "text-[color:var(--warning-ink)]" : "text-[color:var(--success-ink)]"
                }`}
              >
                Stato candidatura
              </div>
              <p
                className={`mt-2 text-sm leading-6 ${
                  isRejected ? "text-[color:var(--warning-ink)]" : "text-[color:var(--success-ink)]"
                }`}
              >
                {isRejected
                  ? "L'account resta non attivo per questo programma. Se il tuo pubblico, i canali o l'affinità commerciale cambiano, puoi inviare una nuova candidatura."
                  : "Le credenziali restano già associate al profilo. Appena il team approva la richiesta, lo stesso accesso ti porterà direttamente nel portale affiliato."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "1. Profilo in valutazione",
              text: "Il team controlla pubblico, canali, nicchia e coerenza con il programma di affiliazione.",
            },
            {
              title: "2. Attivazione accesso",
              text: "In caso di approvazione il portale si attiva con lo stesso account e le stesse credenziali.",
            },
            {
              title: "3. Comunicazione esito",
              text: emailSenderReady
                ? "Ricevi email di conferma e aggiornamento stato senza dover creare un nuovo account."
                : "Lo stato resta consultabile dallo stesso login anche se il sender email non è attivo in questo ambiente.",
            },
          ].map((item) => (
            <Card key={item.title} className="rounded-[28px]">
              <CardContent className="p-5">
                <div className="font-semibold">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[28px]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <MailCheck className="size-5 text-foreground" />
                <div className="font-semibold">
                  {emailSenderReady ? "Controlla la tua inbox" : "Controlla di nuovo dal login"}
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {emailSenderReady
                  ? "Gli aggiornamenti su revisione, approvazione o mancata approvazione arrivano via email lungo lo stesso flusso del programma."
                  : "Il sender email non è attivo in questo ambiente, quindi il punto affidabile resta il login affiliato con lo stato aggiornato."}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px]">
            <CardContent className="p-5">
              <div className="font-semibold">Accesso coerente fino all&apos;esito finale</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Non devi creare un nuovo profilo. Il login affiliato resta il punto di ingresso
                unico sia durante la revisione sia dopo l&apos;attivazione.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login/affiliate">
              Vai al login affiliato
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Registra un nuovo account</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

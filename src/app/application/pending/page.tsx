import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRight, Clock3, MailCheck, ShieldAlert } from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAffiliateWorkspaceAccess } from "@/lib/auth/session";

export default async function PendingApplicationPage() {
  const { accessState } = await requireAffiliateWorkspaceAccess();
  const status = accessState.applicationStatus;

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

      <main className="mx-auto flex w-full max-w-[980px] flex-col gap-6 px-4 pb-16 pt-4 lg:px-6">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status ?? "pending"} />
          </div>
          <h1 className="ui-page-title-hero max-w-3xl">
            {isRejected ? "Candidatura non approvata" : "Revisione in corso"}
          </h1>
          <p className="ui-page-copy max-w-2xl">
            {isRejected
              ? "Il profilo non e stato approvato per l'attuale programma. Puoi comunque presentare una nuova richiesta se il tuo posizionamento o i tuoi canali cambiano."
              : "La richiesta e stata ricevuta correttamente. Finche la review non si chiude, il login affiliato mostra questo stato invece di aprire la dashboard partner."}
          </p>
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
                  ? "L'account resta non attivo per questo programma. Se la tua audience, i canali o il fit commerciale cambiano, puoi inviare una nuova candidatura."
                  : "Le credenziali restano gia associate al profilo. Appena il team approva la richiesta, lo stesso accesso ti portera direttamente nel portale affiliato."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "1. Profilo in valutazione",
              text: "Il team controlla audience, canali, nicchia e coerenza con il programma partner.",
            },
            {
              title: "2. Attivazione accesso",
              text: "In caso di approvazione il portale si attiva con lo stesso account e le stesse credenziali.",
            },
            {
              title: "3. Comunicazione esito",
              text: "Ricevi email di conferma e aggiornamento stato senza dover creare un nuovo account.",
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
                <div className="font-semibold">Controlla la tua inbox</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Gli aggiornamenti su review, approvazione o mancata approvazione arrivano via email
                lungo lo stesso flusso del programma.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px]">
            <CardContent className="p-5">
              <div className="font-semibold">Accesso coerente fino all&apos;esito finale</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Non devi creare un nuovo profilo. Il login affiliato resta il punto di ingresso
                unico sia durante la review sia dopo l&apos;attivazione.
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

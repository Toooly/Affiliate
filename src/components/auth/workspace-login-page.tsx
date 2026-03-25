import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";

import { LoginForm } from "@/components/forms/login-form";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasBackofficeAccess } from "@/lib/auth/roles";
import {
  getPostLoginRedirect,
  sanitizeNextPath,
  workspaceMatchesRole,
  type LoginWorkspace,
} from "@/lib/auth/workspaces";
import { demoCredentials } from "@/lib/constants";
import { getCurrentSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { isDemoMode } from "@/lib/env";

type WorkspaceLoginPageProps = {
  workspace: Extract<LoginWorkspace, "merchant" | "affiliate">;
  searchParams?: {
    next?: string;
    application?: string;
  };
};

export async function WorkspaceLoginPage({
  workspace,
  searchParams,
}: WorkspaceLoginPageProps) {
  const session = await getCurrentSession();

  if (session && workspaceMatchesRole(session.role, workspace)) {
    const applicationStatus = hasBackofficeAccess(session.role)
      ? null
      : await getRepository().getApplicationStatusForProfile(session.profileId);

    redirect(getPostLoginRedirect(session.role, applicationStatus));
  }

  const safeNextPath = sanitizeNextPath(searchParams?.next, workspace);
  const isMerchant = workspace === "merchant";
  const copy = isMerchant
    ? {
        badge: "Login admin / gestore",
        eyebrow: "Controllo globale del programma",
        title: "Accedi al backoffice che governa affiliati, campagne, commissioni e store ops.",
        description:
          "Questa area e riservata a chi controlla tutto il programma affiliate: candidature, payout, codici promo, campagne e stato della connessione Shopify.",
        audience:
          "Se accedi come admin o manager entri nella cabina di regia globale, con visibilita completa su tutti gli affiliati e sui flussi operativi del merchant.",
        checklist: [
          "Rivedi candidature, attiva partner e assegna codici promo e link.",
          "Monitora conversioni, commissioni, payout e anomalie da un unico pannello.",
          "Gestisci store connection, sync e futuri touchpoint Shopify senza passaggi ambigui.",
        ],
        formTitle: "Credenziali area admin",
        formHint:
          "Inserisci email o username e password dell'account backoffice. Questo accesso non apre mai il portale affiliato.",
        submitLabel: "Accedi al backoffice",
        secondaryHref: "/login/affiliate",
        secondaryLabel: "Vai al login affiliato",
        icon: Building2,
        accent: "surface-admin",
        surface: "surface-admin",
        highlightSurface: "border-white/12 bg-white/8 text-white/80",
        switchCopy:
          "Se devi entrare come affiliato, usa il portale personale dedicato invece del backoffice merchant.",
        demoTitle: "Credenziali demo admin",
        demoEmail: demoCredentials.admin.email,
      }
    : {
        badge: "Login affiliato",
        eyebrow: "Accesso personale del partner",
        title: "Accedi al tuo portale affiliato personale senza confusione con l'area admin.",
        description:
          "Qui il singolo affiliato entra nella propria area riservata per link, codici promo, campagne disponibili, asset e stato dei payout.",
        audience:
          "Questa area mostra solo dati, strumenti e performance del singolo affiliato. Nessun accesso alle impostazioni globali o agli altri partner.",
        checklist: [
          "Apri i tuoi referral link, i codici promo e le campagne assegnate.",
          "Controlla click, conversioni, commissioni maturate e payout in attesa.",
          "Mantieni separato l'accesso personale dal backoffice che gestisce l'intero programma.",
        ],
        formTitle: "Credenziali area affiliato",
        formHint:
          "Inserisci email o username e password dell'account affiliato. Se la candidatura non e ancora approvata, verrai indirizzato allo stato di revisione.",
        submitLabel: "Accedi al portale affiliato",
        secondaryHref: "/apply",
        secondaryLabel: "Richiedi accesso affiliato",
        icon: Users,
        accent: "bg-white text-foreground",
        surface:
          "border-border/80 bg-white shadow-[0_36px_96px_-70px_rgba(17,17,17,0.18)]",
        highlightSurface: "border-border/70 bg-background/76 text-muted-foreground",
        switchCopy:
          "Se devi governare tutto il programma, usa invece l'accesso admin / gestore dedicato.",
        demoTitle: "Credenziali demo affiliato",
        demoEmail: demoCredentials.influencer.email,
      };
  const AccentIcon = copy.icon;
  const showApplicationNotice =
    !isMerchant && searchParams?.application === "received";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-5 lg:px-6">
        <Logo withTagline />
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Scegli area</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Torna alla home
            </Link>
          </Button>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 pb-16 pt-8 lg:grid-cols-[1.04fr_0.96fr] lg:px-6">
        <section className="space-y-6">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline">{copy.badge}</Badge>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {copy.description}
            </p>
          </div>

          {showApplicationNotice ? (
            <Card className="border-[color:var(--success)] bg-[color:var(--success-surface)]">
              <CardContent className="flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 size-5 text-[color:var(--success)]" />
                <div>
                  <div className="font-medium text-[color:var(--success)]">Candidatura ricevuta</div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--success)]">
                    Il tuo account e stato creato correttamente. Ora puoi accedere con le
                    credenziali appena impostate: se il profilo e ancora in revisione, verrai
                    portato alla pagina con lo stato della candidatura.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {session ? (
            <Card className="border-[color:var(--warning)] bg-[color:var(--warning-surface)]">
              <CardContent className="flex items-start gap-3 p-5">
                <LockKeyhole className="mt-0.5 size-5 text-[color:var(--warning)]" />
                <div>
                  <div className="font-medium text-[color:var(--warning)]">
                    Sei gia autenticato in un&apos;altra area
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--warning)]">
                    Attualmente il browser ha una sessione attiva come{" "}
                    {hasBackofficeAccess(session.role) ? "admin / gestore" : "affiliato"}.
                    {` ${copy.switchCopy}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className={copy.surface}>
            <CardContent className="p-6 md:p-7 xl:p-8">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-12 items-center justify-center rounded-[18px] border ${
                    isMerchant
                      ? "border-white/14 bg-white/10 text-white"
                      : "border-border/80 bg-secondary text-foreground"
                  }`}
                >
                  <AccentIcon className="size-5" />
                </div>
                <div>
                  <div
                    className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${
                      isMerchant ? "text-white/72" : "text-muted-foreground"
                    }`}
                  >
                    {copy.eyebrow}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{copy.badge}</div>
                </div>
              </div>

              <div
                className={`mt-6 rounded-[24px] border px-5 py-4 text-sm leading-7 ${
                  isMerchant
                    ? "border-white/12 bg-white/8 text-white/82"
                    : "border-border/70 bg-background/70 text-muted-foreground"
                }`}
              >
                {copy.audience}
              </div>

              <div className="mt-6 grid gap-3">
                {copy.checklist.map((item) => (
                  <div key={item} className={`rounded-[22px] border px-4 py-4 ${copy.highlightSurface}`}>
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        className={`mt-0.5 size-4 shrink-0 ${
                          isMerchant ? "text-white/84" : "text-foreground"
                        }`}
                      />
                      <div className="text-sm leading-6">{item}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" variant={isMerchant ? "secondary" : "default"}>
                  <Link href={copy.secondaryHref}>
                    {copy.secondaryLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Vedi tutti gli accessi</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5">
          <Card className="rounded-[34px] border border-border/80 bg-white shadow-[0_32px_84px_-60px_rgba(17,17,17,0.16)]">
            <CardContent className="p-6 md:p-7 xl:p-8">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {copy.formTitle}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.formHint}</p>
              {safeNextPath ? (
                <div className="mt-4 rounded-[22px] border border-border/70 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                  Dopo il login verrai riportato direttamente alla pagina richiesta.
                </div>
              ) : null}
              <LoginForm
                preferredWorkspace={workspace}
                expectedWorkspace={workspace}
                formId={`login-${workspace}`}
                submitLabel={copy.submitLabel}
                preferredRedirectTo={safeNextPath ?? undefined}
                className="mt-6"
                prefillDemoCredentials={false}
                quickFillOptions={[workspace]}
                showQuickFill={isDemoMode()}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-[30px] border border-border/80 bg-white">
              <CardContent className="p-5">
                <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  {copy.demoTitle}
                </div>
                <div className="mt-3 text-lg font-semibold">{copy.demoEmail}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {isDemoMode()
                    ? "Puoi usare il riempimento rapido nel form per provare subito il flusso corretto."
                    : "In ambiente reale questo accesso usa credenziali vere e resta separato dal ruolo opposto."}
                </p>
              </CardContent>
            </Card>

            <Card className={`rounded-[30px] border ${copy.accent}`}>
              <CardContent className="p-5">
                <div
                  className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${
                    isMerchant ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  Routing e ruoli
                </div>
                <div className="mt-3 text-lg font-semibold">
                  Nessun rimbalzo verso la landing sbagliata
                </div>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    isMerchant ? "text-white/76" : "text-muted-foreground"
                  }`}
                >
                  Questo ingresso resta dedicato a {isMerchant ? "admin e manager" : "affiliati"}
                  . Se la sessione e gia corretta, il sistema ti manda direttamente alla tua area
                  di lavoro.
                </p>
              </CardContent>
            </Card>
          </div>

          {!isMerchant ? (
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/apply">Non hai ancora un account? Invia la candidatura</Link>
            </Button>
          ) : null}
        </section>
      </main>
    </div>
  );
}

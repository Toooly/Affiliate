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
import { getAffiliateAccessState, getPostLoginPath } from "@/lib/auth/access";
import { hasBackofficeAccess } from "@/lib/auth/roles";
import {
  sanitizeNextPath,
  workspaceMatchesRole,
  type LoginWorkspace,
} from "@/lib/auth/workspaces";
import { demoCredentials } from "@/lib/constants";
import { getCurrentSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/env";

type WorkspaceLoginPageProps = {
  workspace: Extract<LoginWorkspace, "merchant" | "affiliate">;
  searchParams?: {
    redirectTo?: string;
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
    redirect(
      getPostLoginPath(
        session.role,
        hasBackofficeAccess(session.role)
          ? { applicationStatus: null, isActive: null }
          : await getAffiliateAccessState(session.profileId),
      ),
    );
  }

  const safeNextPath = sanitizeNextPath(
    searchParams?.redirectTo ?? searchParams?.next,
    workspace,
  );
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
        highlightSurface: "ui-surface-panel",
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
        accent: "surface-affiliate",
        surface: "surface-affiliate",
        highlightSurface: "ui-surface-panel",
        switchCopy:
          "Se devi governare tutto il programma, usa invece l'accesso admin / gestore dedicato.",
        demoTitle: "Credenziali demo affiliato",
        demoEmail: demoCredentials.influencer.email,
      };
  const AccentIcon = copy.icon;
  const showApplicationNotice =
    !isMerchant && searchParams?.application === "received";
  const hasDarkSurface = copy.surface.startsWith("surface-");

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

      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-14 pt-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:px-6">
        <section className="space-y-6">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline">{copy.badge}</Badge>
            <h1 className="ui-page-title-hero max-w-4xl">
              {copy.title}
            </h1>
            <p className="ui-page-copy max-w-2xl">
              {copy.description}
            </p>
          </div>

          {showApplicationNotice ? (
            <Card className="ui-notice-success">
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 size-5 text-[color:var(--success-ink)]" />
                <div>
                  <div className="font-medium text-[color:var(--success-ink)]">Candidatura ricevuta</div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--success-ink)]">
                    Il tuo account e stato creato correttamente. Ora puoi accedere con le
                    credenziali appena impostate: se il profilo e ancora in revisione, verrai
                    portato alla pagina con lo stato della candidatura.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {session ? (
            <Card className="ui-notice-warning">
              <CardContent className="flex items-start gap-3 p-4">
                <LockKeyhole className="mt-0.5 size-5 text-[color:var(--warning-ink)]" />
                <div>
                  <div className="font-medium text-[color:var(--warning-ink)]">
                    Sei gia autenticato in un&apos;altra area
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--warning-ink)]">
                    Attualmente il browser ha una sessione attiva come{" "}
                    {hasBackofficeAccess(session.role) ? "admin / gestore" : "affiliato"}.
                    {` ${copy.switchCopy}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className={copy.surface}>
            <CardContent className="p-5 md:p-6 xl:p-7">
              <div className="flex items-center gap-3">
                <div
                className={`flex size-12 items-center justify-center rounded-[18px] border ${
                  hasDarkSurface
                      ? "ui-surface-panel text-[color:var(--surface-copy)]"
                      : "ui-icon-chip border-0"
                  }`}
                >
                  <AccentIcon className="size-5" />
                </div>
                <div>
                  <div
                    className={`ui-surface-overline ${
                      hasDarkSurface ? "text-[color:var(--surface-muted)]" : "text-muted-foreground"
                    }`}
                  >
                    {copy.eyebrow}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{copy.badge}</div>
                </div>
              </div>

              <div
                className={`mt-5 rounded-[22px] border px-4 py-3.5 text-sm leading-6 ${
                  hasDarkSurface
                    ? "ui-surface-panel"
                    : "ui-soft-block ui-soft-block-strong text-muted-foreground"
                }`}
              >
                {copy.audience}
              </div>

              <div className="mt-5 grid gap-2.5">
                {copy.checklist.map((item) => (
                  <div key={item} className={`rounded-[18px] border px-4 py-3.5 ${copy.highlightSurface}`}>
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        className={`mt-0.5 size-4 shrink-0 ${
                          hasDarkSurface ? "text-[color:var(--surface-copy)]" : "text-foreground"
                        }`}
                      />
                      <div className="text-sm leading-6">{item}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary">
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
          <Card className="rounded-[30px]">
            <CardContent className="p-5 md:p-6 xl:p-7">
              <div className="ui-page-overline text-muted-foreground">
                {copy.formTitle}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.formHint}</p>
              {safeNextPath ? (
                <div className="ui-inline-notice mt-4 px-4 py-3 text-sm">
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
            <Card className="rounded-[26px]">
              <CardContent className="p-4 md:p-5">
                <div className="ui-page-overline text-muted-foreground">
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

            <Card className={`rounded-[26px] border ${copy.accent}`}>
              <CardContent className="p-4 md:p-5">
                <div
                  className={`ui-surface-overline ${
                    hasDarkSurface ? "text-[color:var(--surface-muted)]" : "text-muted-foreground"
                  }`}
                >
                  Routing e ruoli
                </div>
                <div className="mt-3 text-lg font-semibold">
                  Nessun rimbalzo verso la landing sbagliata
                </div>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    hasDarkSurface ? "ui-surface-copy" : "text-muted-foreground"
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

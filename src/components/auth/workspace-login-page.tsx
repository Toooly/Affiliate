import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { LoginForm } from "@/components/forms/login-form";
import { PublicHeader } from "@/components/public/public-header";
import { WorkspacePreview } from "@/components/public/workspace-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasBackofficeAccess } from "@/lib/auth/roles";
import { getCurrentSession } from "@/lib/auth/session";
import { sanitizeNextPath, type LoginWorkspace } from "@/lib/auth/workspaces";

type WorkspaceLoginPageProps = {
  workspace: Extract<LoginWorkspace, "merchant" | "affiliate">;
  searchParams?: {
    redirectTo?: string;
    next?: string;
    application?: string;
  };
};

const loginPageCopy = {
  merchant: {
    badge: "Back office merchant",
    title: "Accedi al back office che governa tutto il programma di affiliazione.",
    description:
      "Questa superficie \u00E8 riservata a chi gestisce candidature, affiliati, codici promo, commissioni, payout e operativit\u00E0 store.",
    formTitle: "Accesso merchant",
    formHint:
      "Usa le credenziali del tuo account admin o manager per entrare nell'area operativa del programma.",
    submitLabel: "Accedi al back office",
    secondaryHref: "/login/affiliate",
    secondaryLabel: "Vai al login affiliato",
    supportTitle: "Accesso progettato per il team merchant",
    supportText:
      "Il login merchant resta separato dal portale affiliato per mantenere governance, autorizzazioni e flussi interni in un'unica area coerente.",
    supportPoints: [
      "Sessioni separate per ruolo e redirect coerenti verso l'area corretta.",
      "Recupero accesso e reset password gestiti tramite supporto account.",
      "Accesso progettato per un ambiente operativo reale, senza scorciatoie o percorsi ambigui.",
    ],
  },
  affiliate: {
    badge: "Portale affiliato",
    title: "Accedi al tuo portale affiliato personale senza passare dal back office merchant.",
    description:
      "Qui l'affiliato gestisce solo i propri link, codici promo, campagne, impostazioni payout e performance personali.",
    formTitle: "Accesso affiliato",
    formHint:
      "Usa il tuo account affiliato per entrare nel portale personale. Se il profilo \u00E8 ancora in revisione, il sistema ti mostrer\u00E0 subito lo stato corretto.",
    submitLabel: "Accedi al portale affiliato",
    secondaryHref: "/register",
    secondaryLabel: "Registrati",
    supportTitle: "Accesso progettato per il singolo affiliato",
    supportText:
      "Il portale affiliato \u00E8 focalizzato su performance, codici, asset e payout del singolo account, senza visibilit\u00E0 sulle funzioni merchant.",
    supportPoints: [
      "Se la candidatura \u00E8 in revisione, entri direttamente nello stato corretto.",
      "Se non hai ancora un account, puoi registrarti dal percorso pubblico dedicato.",
      "Recupero accesso e password reset gestiti come supporto account.",
      "L'area personale resta separata dalle funzioni di amministrazione globale.",
    ],
  },
} as const;

export async function WorkspaceLoginPage({
  workspace,
  searchParams,
}: WorkspaceLoginPageProps) {
  const session = await getCurrentSession();

  const safeNextPath = sanitizeNextPath(
    searchParams?.redirectTo ?? searchParams?.next,
    workspace,
  );
  const copy = loginPageCopy[workspace];
  const showApplicationNotice =
    workspace === "affiliate" && searchParams?.application === "received";

  return (
    <div className="min-h-screen">
      <PublicHeader>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Scegli area</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Torna alla home
          </Link>
        </Button>
      </PublicHeader>

      <main className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 pb-16 pt-6 lg:px-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)] xl:items-start">
        <section className="ui-page-stack">
          <Card className="ui-card-stage rounded-[34px]">
            <CardContent className="ui-page-stack p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{copy.badge}</Badge>
                <Badge variant="outline">Accesso per ruolo</Badge>
              </div>
              <div className="max-w-3xl">
                <h1 className="ui-page-title-hero max-w-4xl">{copy.title}</h1>
                <p className="ui-page-copy mt-4 max-w-2xl">{copy.description}</p>
              </div>
            </CardContent>
          </Card>

          {showApplicationNotice ? (
            <Card className="ui-notice-success rounded-[28px]">
              <CardContent className="flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 size-5 text-[color:var(--success-ink)]" />
                <div>
                  <div className="font-medium text-[color:var(--success-ink)]">
                    Candidatura ricevuta
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--success-ink)]">
                    La richiesta &egrave; stata inviata correttamente. Le credenziali che hai
                    impostato restano associate al profilo: se accedi adesso vedrai lo stato della
                    revisione finch&eacute; il team non approva l&apos;accesso.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {session ? (
            <Card className="ui-notice-warning rounded-[28px]">
              <CardContent className="flex items-start gap-3 p-5">
                <LockKeyhole className="mt-0.5 size-5 text-[color:var(--warning-ink)]" />
                <div>
                  <div className="font-medium text-[color:var(--warning-ink)]">
                    Sessione attiva in un&apos;altra area
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--warning-ink)]">
                    Il browser ha gi&agrave; una sessione aperta come{" "}
                    {hasBackofficeAccess(session.role) ? "merchant" : "affiliato"}. Per entrare
                    qui usa l&apos;area corretta oppure cambia accesso dal selettore dedicato.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <WorkspacePreview workspace={workspace} />

          <Card className="ui-card-soft rounded-[30px]">
            <CardContent className="p-5">
              <div className="ui-page-overline text-muted-foreground">{copy.supportTitle}</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.supportText}</p>
              <div className="mt-4 grid gap-3">
                {copy.supportPoints.map((point) => (
                  <div key={point} className="ui-soft-block rounded-[22px] p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <p className="text-sm leading-6 text-muted-foreground">{point}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="ui-page-stack">
          <Card className="ui-card-soft rounded-[32px]">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="ui-page-overline text-muted-foreground">{copy.formTitle}</div>
                  <div className="ui-card-title mt-2">Entra nella tua area</div>
                </div>
                <Badge variant="outline">Accesso sicuro</Badge>
              </div>

              <p className="mt-4 text-sm leading-7 text-muted-foreground">{copy.formHint}</p>

              {safeNextPath ? (
                <div className="ui-inline-notice mt-5 px-4 py-3 text-sm">
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
              />

              {workspace === "affiliate" ? (
                <div className="mt-5 rounded-[22px] border border-border/80 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Non hai ancora un account?{" "}
                  <Link
                    href="/register"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    Registrati come affiliato
                  </Link>
                  .
                </div>
              ) : null}

              <div className="mt-5 border-t border-border/80 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground">Hai dimenticato la password?</div>
                    <p className="mt-1 text-muted-foreground">
                      Il recupero accesso &egrave; gestito dal team account del programma.
                    </p>
                  </div>
                  <div className="rounded-full border border-border/80 bg-background/80 px-4 py-2 text-muted-foreground">
                    Sessione vincolata al ruolo corretto
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="ui-card-soft rounded-[30px]">
            <CardContent className="p-5">
              <div className="ui-page-overline text-muted-foreground">Altro percorso</div>
              <div className="ui-card-title mt-3">Serve un accesso diverso?</div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Usa la pagina dedicata al ruolo corretto invece di forzare un login ambiguo.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="outline">
                  <Link href={copy.secondaryHref}>{copy.secondaryLabel}</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/login">
                    Torna al selettore accessi
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

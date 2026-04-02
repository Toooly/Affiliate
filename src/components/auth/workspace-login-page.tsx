import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { WorkspacePreview } from "@/components/public/workspace-preview";
import { LoginForm } from "@/components/forms/login-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasBackofficeAccess } from "@/lib/auth/roles";
import {
  sanitizeNextPath,
  type LoginWorkspace,
} from "@/lib/auth/workspaces";
import { getCurrentSession } from "@/lib/auth/session";

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
    badge: "Merchant backoffice",
    title: "Accedi al backoffice che governa tutto il programma affiliate.",
    description:
      "Questa superficie e riservata a chi gestisce candidature, affiliati, codici promo, commissioni, payout e operativita store.",
    formTitle: "Accesso merchant",
    formHint:
      "Usa le credenziali del tuo account admin o manager per entrare nel workspace operativo del programma.",
    submitLabel: "Accedi al backoffice",
    secondaryHref: "/login/affiliate",
    secondaryLabel: "Vai al login affiliato",
    supportTitle: "Accesso progettato per il team merchant",
    supportText:
      "Il login merchant resta separato dal portale partner per mantenere governance, autorizzazioni e flussi interni in un solo workspace coerente.",
    supportPoints: [
      "Sessioni separate per ruolo e redirect coerenti verso il workspace corretto.",
      "Recupero accesso e reset password gestiti tramite supporto account.",
      "Accesso progettato per un ambiente operativo reale, senza scorciatoie o percorsi ambigui.",
    ],
  },
  affiliate: {
    badge: "Partner portal",
    title: "Accedi al tuo portale affiliato personale senza passare dal backoffice merchant.",
    description:
      "Qui il partner gestisce solo i propri link, codici promo, campagne, payout settings e performance personali.",
    formTitle: "Accesso affiliato",
    formHint:
      "Usa il tuo account partner per entrare nel portale personale. Se il profilo e ancora in revisione, il sistema ti mostrera subito lo stato corretto.",
    submitLabel: "Accedi al portale affiliato",
    secondaryHref: "/register",
    secondaryLabel: "Registrati",
    supportTitle: "Accesso progettato per il singolo partner",
    supportText:
      "Il portale affiliato e focalizzato su performance, codici, asset e payout del singolo account, senza visibilita sulle funzioni merchant.",
    supportPoints: [
      "Se la candidatura e in review, entri direttamente nello stato di revisione.",
      "Se non hai ancora un account, puoi registrarti dal percorso pubblico dedicato.",
      "Recupero accesso e password reset gestiti come supporto account.",
      "Il workspace personale resta separato dalle funzioni di amministrazione globale.",
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

      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-16 pt-4 lg:px-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)]">
        <section className="space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{copy.badge}</Badge>
              <Badge variant="outline">Role-bound access</Badge>
            </div>
            <h1 className="ui-page-title-hero max-w-4xl">{copy.title}</h1>
            <p className="ui-page-copy max-w-2xl">{copy.description}</p>
          </div>

          {showApplicationNotice ? (
            <Card className="ui-notice-success rounded-[28px]">
              <CardContent className="flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 size-5 text-[color:var(--success-ink)]" />
                <div>
                  <div className="font-medium text-[color:var(--success-ink)]">
                    Candidatura ricevuta
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--success-ink)]">
                    La richiesta e stata inviata correttamente. Le credenziali che hai impostato
                    restano associate al profilo: se accedi adesso vedrai lo stato della revisione
                    finche il team non approva l&apos;accesso.
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
                    Sessione attiva in un altro workspace
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--warning-ink)]">
                    Il browser ha gia una sessione aperta come{" "}
                    {hasBackofficeAccess(session.role) ? "merchant" : "affiliato"}. Per entrare
                    qui usa il workspace corretto oppure cambia accesso dal selettore dedicato.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <WorkspacePreview workspace={workspace} />

          <Card className="rounded-[30px]">
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

        <section className="space-y-5">
          <Card className="rounded-[32px]">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="ui-page-overline text-muted-foreground">{copy.formTitle}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    Entra nel tuo workspace
                  </div>
                </div>
                <Badge variant="outline">Secure access</Badge>
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
                  <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
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
                      Il recupero accesso e gestito dal team account del programma.
                    </p>
                  </div>
                  <div className="rounded-full border border-border/80 bg-background/80 px-4 py-2 text-muted-foreground">
                    Sessione vincolata al ruolo corretto
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px]">
            <CardContent className="p-5">
              <div className="ui-page-overline text-muted-foreground">Altro percorso</div>
              <div className="mt-3 text-lg font-semibold tracking-tight">
                Serve un accesso diverso?
              </div>
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

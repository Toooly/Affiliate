import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft, ArrowRight, Building2, Users } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasBackofficeAccess } from "@/lib/auth/roles";
import { getCurrentSession } from "@/lib/auth/session";
import { getPostLoginRedirect, getLoginPath, isLoginWorkspace } from "@/lib/auth/workspaces";
import { getRepository } from "@/lib/data/repository";
import { demoCredentials } from "@/lib/constants";

type LoginPageProps = {
  searchParams?: Promise<{
    workspace?: string;
    next?: string;
    application?: string;
  }>;
};

function buildWorkspaceRedirect(
  workspace: "merchant" | "affiliate" | "pending",
  params: {
    next?: string;
    application?: string;
  },
) {
  const target = getLoginPath(workspace);
  const next = params.next ? `next=${encodeURIComponent(params.next)}` : null;
  const application =
    params.application && workspace !== "merchant"
      ? `application=${encodeURIComponent(params.application)}`
      : null;
  const query = [next, application].filter(Boolean).join("&");

  return query ? `${target}?${query}` : target;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  if (isLoginWorkspace(params.workspace)) {
    redirect(buildWorkspaceRedirect(params.workspace, params));
  }

  if (params.application) {
    redirect(buildWorkspaceRedirect("affiliate", params));
  }

  const session = await getCurrentSession();

  if (session) {
    const applicationStatus = hasBackofficeAccess(session.role)
      ? null
      : await getRepository().getApplicationStatusForProfile(session.profileId);

    redirect(getPostLoginRedirect(session.role, applicationStatus));
  }

  const roleCards = [
    {
      href: "/login/admin",
      title: "Area Admin / Gestore",
      description:
        "Backoffice globale per store, affiliati, candidature, codici promo, commissioni e payout.",
      icon: Building2,
      tag: "Controllo globale",
      credential: demoCredentials.admin.email,
    },
    {
      href: "/login/affiliate",
      title: "Area Affiliato",
      description:
        "Portale personale per referral link, codici promo, campagne, performance e payout.",
      icon: Users,
      tag: "Accesso personale",
      credential: demoCredentials.influencer.email,
    },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-5 lg:px-6">
        <Logo withTagline />
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Torna alla home
          </Link>
        </Button>
      </div>

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 pb-16 pt-8 lg:px-6">
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline">Selezione area di accesso</Badge>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Scegli il flusso corretto prima di entrare nella piattaforma.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Affinity separa nettamente l&apos;area admin / gestore dall&apos;area affiliato.
            Da qui scegli il percorso giusto e accedi alla pagina login dedicata, senza
            passare da route condivise o landing intermedie.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {roleCards.map((item) => (
            <Link key={item.href} href={item.href} className="group block">
              <Card className="ui-card-soft-interactive h-full rounded-[34px]">
                <CardContent className="flex h-full flex-col p-6 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="ui-surface-overline text-muted-foreground">
                        {item.tag}
                      </div>
                      <div className="mt-3 text-2xl font-semibold tracking-tight">
                        {item.title}
                      </div>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="ui-icon-chip flex size-12 items-center justify-center rounded-[18px]">
                      <item.icon className="size-5" />
                    </div>
                  </div>

                  <div className="ui-soft-block mt-6 rounded-[24px] px-4 py-4">
                    <div className="ui-surface-overline text-muted-foreground">
                      Ingresso dedicato
                    </div>
                    <div className="mt-3 text-sm font-medium">{item.credential}</div>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="inline-flex items-center gap-2 text-sm font-medium">
                      Apri accesso dedicato
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/apply">Richiedi accesso affiliato</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

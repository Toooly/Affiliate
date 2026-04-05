import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { ArrowLeft, ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginPath, isLoginWorkspace } from "@/lib/auth/workspaces";

export const metadata: Metadata = {
  title: "Seleziona l'accesso | Affinity",
  description:
    "Scegli l'accesso corretto tra back office merchant e portale affiliato di Affinity.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    workspace?: string;
    next?: string;
    redirectTo?: string;
    application?: string;
  }>;
};

function buildWorkspaceRedirect(
  workspace: "merchant" | "affiliate" | "pending",
  params: {
    next?: string;
    redirectTo?: string;
    application?: string;
  },
) {
  const target = getLoginPath(workspace);
  const redirectTo = params.redirectTo ?? params.next;
  const next = redirectTo ? `redirectTo=${encodeURIComponent(redirectTo)}` : null;
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

  const roleCards = [
    {
      href: "/login/admin",
      title: "Back office merchant",
      description:
        "Accesso per admin e manager che governano candidature, affiliati, codici promo, commissioni, payout e operatività store.",
      scope: "Visibilità completa su programma, affiliati, operatività campagne e controllo payout.",
      icon: Building2,
      badge: "Controllo operativo",
      points: [
        "Rivedi le candidature e attiva solo i partner approvati.",
        "Controlla codici promo, referral link, commissioni e payout.",
        "Mantieni una vista coerente su store ops e programma affiliate.",
      ],
      secondaryHref: null,
      secondaryLabel: null,
    },
    {
      href: "/login/affiliate",
      title: "Portale affiliato",
      description:
        "Accesso personale del singolo affiliato per link, codici promo, campagne disponibili, asset e stato dei payout.",
      scope: "Area personale limitata al profilo del singolo affiliato.",
      icon: Users,
      badge: "Accesso personale",
      points: [
        "Apri solo la tua area e i tuoi materiali operativi.",
        "Consulta performance, commissioni e payout senza vedere il resto del programma.",
        "Se la candidatura è ancora in revisione, entri direttamente nello stato corretto.",
      ],
      secondaryHref: "/register",
      secondaryLabel: "Registrati",
    },
  ] as const;

  return (
    <div className="min-h-screen">
      <PublicHeader>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Torna alla home
          </Link>
        </Button>
      </PublicHeader>

      <main className="mx-auto ui-page-stack w-full max-w-[1180px] px-4 pb-16 pt-6 lg:px-6">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:items-start">
          <Card className="ui-card-stage rounded-[34px]">
            <CardContent className="ui-page-stack p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Selezione accesso</Badge>
                <Badge variant="outline">Percorsi ufficiali</Badge>
              </div>

              <div>
                <h1 className="ui-page-title-hero max-w-3xl">
                  Scegli il percorso corretto prima di entrare in piattaforma.
                </h1>
                <p className="ui-page-copy mt-4 max-w-2xl">
                  Affinity mantiene separati il back office merchant e il portale affiliato.
                  Da qui scegli il percorso giusto e apri la pagina login dedicata, senza
                  scorciatoie, percorsi misti o frizioni inutili in ingresso.
                </p>
              </div>

              <div className="ui-soft-block rounded-[26px] p-4">
                <div className="flex items-start gap-3">
                  <div className="ui-icon-chip flex size-11 items-center justify-center rounded-[18px]">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Perché questa separazione conta</div>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Merchant e affiliati non condividono la stessa superficie operativa.
                      Separare gli ingressi rende più chiari permessi, aspettative e flussi fin dal
                      primo accesso.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {roleCards.map((item) => (
            <Card key={item.href} className="ui-card-soft h-full rounded-[32px]">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-4">
                    <Badge variant="outline">{item.badge}</Badge>
                    <div className="space-y-3">
                      <h2 className="ui-page-title">{item.title}</h2>
                      <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="ui-icon-chip flex size-12 items-center justify-center rounded-[18px]">
                    <item.icon className="size-5" />
                  </div>
                </div>

                <div className="ui-soft-block ui-soft-block-strong mt-5 rounded-[24px] p-4 text-sm leading-7 text-muted-foreground">
                  {item.scope}
                </div>

                <div className="mt-5 space-y-3">
                  {item.points.map((point) => (
                    <div key={point} className="ui-soft-block rounded-[22px] p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                        <p className="text-sm leading-6 text-muted-foreground">{point}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href={item.href}>
                      Apri login dedicato
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  {item.secondaryHref && item.secondaryLabel ? (
                    <Button asChild size="lg" variant="outline">
                      <Link href={item.secondaryHref}>{item.secondaryLabel}</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}

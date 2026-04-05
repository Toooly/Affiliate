import Link from "next/link";
import type { Metadata } from "next";

import { ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Affinity | Accesso merchant e affiliati",
  description:
    "Ingresso ufficiale alla piattaforma Affinity per team merchant e affiliati.",
};

const accessCards = [
  {
    title: "Area merchant",
    description: "Controlla programma, affiliati, codici promo, campagne, commissioni e payout dal back office operativo.",
    href: "/login/admin",
    cta: "Accedi al back office",
    icon: Building2,
    className: "surface-brand",
    badgeVariant: "surface" as const,
    textClassName: "text-[color:var(--surface-copy)]",
    iconClassName: "bg-white/10 text-[color:var(--surface-foreground)]",
    buttonVariant: "secondary" as const,
    secondaryHref: null,
    secondaryLabel: null,
  },
  {
    title: "Area affiliato",
    description: "Accedi al portale personale per link, performance, materiali approvati e impostazioni payout.",
    href: "/login/affiliate",
    cta: "Accedi al portale",
    secondaryHref: "/register",
    secondaryLabel: "Registrati",
    icon: Users,
    className: "ui-card-soft",
    badgeVariant: "outline" as const,
    textClassName: "text-muted-foreground",
    iconClassName: "ui-icon-chip border-0",
    buttonVariant: "default" as const,
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen">
      <PublicHeader />

      <div className="mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-[1120px] flex-col justify-center px-4 pb-16 pt-6 lg:px-6">
        <div className="ui-page-stack">
          <section className="mx-auto w-full max-w-[980px]">
            <Card className="ui-card-stage rounded-[36px]">
              <CardContent className="ui-page-stack p-6 text-center md:p-8">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="outline">Piattaforma ufficiale</Badge>
            <Badge variant="outline">Merchant + Affiliati</Badge>
                </div>

                <div className="mx-auto max-w-[860px]">
                  <h1 className="ui-display-title">
                    Entra nell&apos;area corretta del programma di affiliazione.
                  </h1>
                  <p className="ui-page-copy mx-auto mt-4 max-w-2xl text-base leading-8">
                    Affinity separa il back office merchant dal portale affiliato per mantenere ruoli,
                    responsabilit&agrave; e operativit&agrave; sempre chiari in ogni fase del programma.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mx-auto grid w-full max-w-[980px] gap-5 lg:grid-cols-2">
          {accessCards.map((item) => (
            <Card
              key={item.title}
              className={`h-full overflow-hidden rounded-[32px] ${item.className}`}
            >
              <CardContent className="p-6 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-4">
                    <Badge variant={item.badgeVariant}>{item.title}</Badge>
                    <div className="space-y-3">
                      <h2 className="ui-page-title">{item.title}</h2>
                      <p className={`text-sm leading-7 ${item.textClassName}`}>{item.description}</p>
                    </div>
                  </div>

                  <div
                    className={`flex size-12 items-center justify-center rounded-[18px] ${item.iconClassName}`}
                  >
                    <item.icon className="size-5" />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg" variant={item.buttonVariant}>
                    <Link href={item.href}>
                      {item.cta}
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

          <section className="mx-auto w-full max-w-[980px]">
            <Card className="ui-card-soft rounded-[30px]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                  <p>
                    Il team merchant governa il programma di affiliazione. L&apos;affiliato accede al proprio
                    portale per link, performance e commissioni. Se non hai ancora un account
                    affiliato, puoi registrarti da{" "}
                    <Link
                      href="/register"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      qui
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

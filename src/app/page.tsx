import Link from "next/link";
import type { Metadata } from "next";

import { ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Affinity | Accesso Merchant e Partner",
  description:
    "Ingresso ufficiale alla piattaforma Affinity per team merchant e partner affiliati.",
};

const accessCards = [
  {
    title: "Area merchant",
    description: "Controlla programma, partner, codici promo, campagne, commissioni e payout dal backoffice operativo.",
    href: "/login/admin",
    cta: "Accedi al backoffice",
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
    title: "Area partner",
    description: "Accedi al portale personale per link, performance, materiali approvati e payout settings.",
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
        <section className="mx-auto w-full max-w-[860px] text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline">Piattaforma ufficiale</Badge>
            <Badge variant="outline">Merchant + Partner</Badge>
          </div>

          <h1 className="ui-display-title mt-6">
            Entra nel workspace corretto del programma affiliate.
          </h1>
          <p className="ui-page-copy mx-auto mt-4 max-w-2xl text-base leading-8">
            Affinity separa il backoffice merchant dal portale partner per mantenere ruoli,
            responsabilita e operativita sempre chiari in ogni fase del programma.
          </p>
        </section>

        <section className="mx-auto mt-10 grid w-full max-w-[980px] gap-5 lg:grid-cols-2">
          {accessCards.map((item) => (
            <Card key={item.title} className={`overflow-hidden rounded-[32px] ${item.className}`}>
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

        <section className="mx-auto mt-6 w-full max-w-[980px]">
          <div className="rounded-[28px] border border-border/80 bg-background/70 px-5 py-4 text-sm leading-7 text-muted-foreground shadow-[0_18px_46px_-34px_rgba(14,18,28,0.16)]">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
              <p>
                Il team merchant governa il programma affiliate. Il partner accede al proprio
                portale per link, performance e commissioni. Se non hai ancora un account
                partner, puoi registrarti da{" "}
                <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
                  qui
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

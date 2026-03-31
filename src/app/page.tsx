import Link from "next/link";
import type { Metadata } from "next";

import { ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Affinity | Accesso Admin e Affiliato",
  description:
    "Punto d'ingresso essenziale per le due aree del prodotto: Admin e Affiliato.",
};

const accessCards = [
  {
    title: "Accesso Admin",
    description: "Gestisci programma, affiliati, codici, campagne e payout dal backoffice.",
    href: "/login/admin",
    cta: "Apri area Admin",
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
    title: "Accesso Affiliato",
    description: "Monitora link, performance, commissioni e materiali nel tuo portale personale.",
    href: "/login/affiliate",
    cta: "Apri area Affiliato",
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
            <Badge variant="outline">Due aree distinte</Badge>
            <Badge variant="outline">Admin + Affiliato</Badge>
          </div>

          <h1 className="ui-display-title mt-6">
            Scegli l&apos;area di accesso corretta.
          </h1>
          <p className="ui-page-copy mx-auto mt-4 max-w-2xl text-base leading-8">
            Affinity separa il backoffice Admin dal portale Affiliato per mantenere ruoli,
            accessi e operativita sempre chiari.
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
                L&apos;Admin gestisce il programma affiliate. L&apos;Affiliato accede al proprio
                portale per link, performance e commissioni. Se non hai ancora un account
                affiliato, puoi registrarti da{" "}
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

import Link from "next/link";

import { ArrowLeft, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ShopPageProps = {
  searchParams?: Promise<{
    ref?: string;
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-4 py-5 lg:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Torna alla home
          </Link>
        </Button>
        {params.ref ? (
          <div className="rounded-full border border-border/80 bg-white px-4 py-2 text-xs font-medium tracking-[0.18em] text-foreground uppercase">
            Referral da {params.ref}
          </div>
        ) : null}
      </div>
      <main className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 pb-16 pt-10 lg:grid-cols-[1fr_0.9fr] lg:px-6">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white px-4 py-2 text-xs font-medium tracking-[0.18em] text-foreground uppercase">
            <ShoppingBag className="size-3.5" />
            Vetrina demo
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-balance">
            Questa vetrina demo simula il punto in cui atterra il traffico referral.
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            La route `/r/[slug]` registra il click e indirizza qui i visitatori. In un&apos;implementazione reale, questa destinazione puo essere sostituita con Shopify, WooCommerce o un&apos;esperienza commerce custom.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="surface-neutral rounded-[28px] p-6">
              <div className="text-xs tracking-[0.18em] uppercase text-white/70">
                Prodotto demo
              </div>
              <div className="mt-3 text-4xl font-semibold">$129</div>
              <div className="mt-2 text-sm text-white/75">
                Pronto per attribuzione referral creator
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              In questa fase MVP, le conversioni vengono create manualmente dall&apos;area admin. Lo schema e gia pensato per sostituire in seguito questo flusso con un sync ordini reale.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}




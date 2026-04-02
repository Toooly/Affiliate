import Link from "next/link";

import { ArrowLeft, ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
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
        {params.ref ? <div className="ui-filter-chip ui-filter-chip-active">Referral da {params.ref}</div> : null}
      </div>
      <main className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:px-6">
        <div className="space-y-6">
          <div className="ui-filter-chip ui-filter-chip-active">
            <ShoppingBag className="size-3.5" />
            Destinazione storefront
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-balance">
            Qui atterra il traffico referral prima di proseguire sul catalogo o sulle landing del brand.
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            La route `/r/[slug]` registra il click e inoltra il visitatore verso la destinazione
            configurata dal programma. In produzione questa superficie puo aprire Shopify,
            una landing editoriale o un&apos;esperienza commerce custom mantenendo l&apos;attribuzione.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <EmptyState
              icon={ShoppingBag}
              title="Catalogo non ancora sincronizzato"
              description="Questa destinazione e pronta per ricevere traffico referral, ma mostrera prodotti, prezzi e collezioni solo dopo una sincronizzazione reale da Shopify."
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}




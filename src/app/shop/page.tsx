import Link from "next/link";

import { ArrowLeft, ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PublicHeader } from "@/components/public/public-header";
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
      <PublicHeader maxWidthClassName="max-w-[1120px]">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Torna alla home
          </Link>
        </Button>
        {params.ref ? <div className="ui-filter-chip ui-filter-chip-active">Referral da {params.ref}</div> : null}
      </PublicHeader>
      <main className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start lg:px-6">
        <section className="ui-page-stack">
          <Card className="ui-card-stage rounded-[34px]">
            <CardContent className="ui-page-stack p-6 md:p-7">
              <div className="ui-filter-chip ui-filter-chip-active w-fit">
                <ShoppingBag className="size-3.5" />
                Destinazione storefront
              </div>
              <div>
                <h1 className="ui-page-title-hero text-balance">
                  Qui atterra il traffico referral prima di proseguire sul catalogo o sulle landing del brand.
                </h1>
                <p className="ui-page-copy mt-4">
                  La route `/r/[slug]` registra il click e inoltra il visitatore verso la destinazione
                  configurata dal programma. In produzione questa superficie può aprire Shopify,
                  una landing editoriale o un&apos;esperienza commerce custom mantenendo l&apos;attribuzione.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="ui-card-soft rounded-[30px]">
            <CardContent className="p-5">
              <div className="font-semibold">Stato della destinazione</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Questa pagina resta una superficie di transito: mostra il contesto referral e può
                essere sostituita da una destinazione storefront reale non appena catalogo, prodotti
                e collezioni vengono sincronizzati con Shopify.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="ui-page-stack">
          <EmptyState
            icon={ShoppingBag}
            title="Catalogo non ancora sincronizzato"
            description="Questa destinazione e pronta per ricevere traffico referral, ma mostrera prodotti, prezzi e collezioni solo dopo una sincronizzazione reale da Shopify."
          />
          {params.ref ? (
            <Card className="ui-card-soft rounded-[28px]">
              <CardContent className="p-5">
                <div className="ui-page-overline text-muted-foreground">Referral rilevato</div>
                <div className="mt-3 ui-wrap-anywhere text-sm leading-7 text-muted-foreground">
                  Il visitatore è arrivato con il codice referral <span className="font-semibold text-foreground">{params.ref}</span>, che può essere mantenuto lungo il passaggio verso catalogo, carrello e checkout.
                </div>
              </CardContent>
            </Card>
          ) : null}
        </section>
      </main>
    </div>
  );
}




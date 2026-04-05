import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRight, PauseCircle, ShieldAlert } from "lucide-react";

import { PublicHeader } from "@/components/public/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAffiliateWorkspaceAccess } from "@/lib/auth/session";

export default async function InactiveApplicationPage() {
  const { accessState } = await requireAffiliateWorkspaceAccess();

  if (accessState.applicationStatus !== "approved") {
    redirect("/application/pending");
  }

  if (accessState.isActive !== false) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <PublicHeader maxWidthClassName="max-w-[980px]">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Torna alla home</Link>
        </Button>
      </PublicHeader>

      <main className="mx-auto ui-page-stack w-full max-w-[980px] px-4 pb-16 pt-4 lg:px-6">
        <section>
          <Card className="ui-card-stage rounded-[34px]">
            <CardContent className="ui-page-stack p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-warning/30 bg-warning-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--warning-ink)]">
                  Accesso sospeso
                </div>
              </div>
              <div>
                <h1 className="ui-page-title-hero max-w-3xl">Accesso temporaneamente sospeso</h1>
                <p className="ui-page-copy mt-4 max-w-2xl">
                  L&apos;account affiliato è stato approvato ma al momento non è attivo. Il portale resta
                  bloccato finché il team merchant non riattiva il profilo.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="ui-notice-warning rounded-[32px]">
          <CardContent className="flex items-start gap-3 p-5">
            <PauseCircle className="mt-0.5 size-5 text-[color:var(--warning-ink)]" />
            <div>
              <div className="font-medium text-[color:var(--warning-ink)]">
                Stato account affiliato
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--warning-ink)]">
                Il profilo esiste ed è approvato, ma al momento non può accedere alla dashboard.
                Lo stesso login tornerà operativo appena il team merchant riattiverà l&apos;account.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[28px]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="size-5 text-foreground" />
                <div className="font-semibold">Perché vedi questa pagina</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Il merchant può sospendere temporaneamente un affiliato per revisione, pausa del
                rapporto commerciale o riallineamento operativo. Lo stato viene applicato a login,
                refresh e route protette.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px]">
            <CardContent className="p-5">
              <div className="font-semibold">Prossimi passi</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Contatta il team merchant se serve aggiornare il profilo, verificare i requisiti o
                concordare la riattivazione dell&apos;accesso affiliato.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login/affiliate">
              Torna al login affiliato
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Vai alla home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

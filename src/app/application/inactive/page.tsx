import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRight, PauseCircle, ShieldAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="mx-auto flex w-full max-w-[900px] items-center justify-between px-4 py-5 lg:px-6">
        <Logo withTagline />
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Torna alla home</Link>
        </Button>
      </div>

      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 pb-16 pt-6 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Account affiliato non attivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="ui-soft-block ui-soft-block-strong p-6">
              <div className="flex items-center gap-3">
                <PauseCircle className="size-5 text-primary" />
                <div className="font-medium">Accesso temporaneamente sospeso</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Il tuo account creator e stato approvato ma al momento non e attivo.
                L&apos;accesso alla dashboard resta bloccato finche il team admin non
                riattiva il profilo.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="ui-card-soft">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="size-5 text-primary" />
                    <div className="font-medium">Perche vedi questa pagina</div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    L&apos;admin puo disattivare un affiliato per revisione, pausa
                    operativa o sospensione del rapporto commerciale. Lo stato del
                    profilo viene applicato anche su login, refresh e route protette.
                  </p>
                </CardContent>
              </Card>

              <Card className="ui-card-soft">
                <CardContent className="p-5">
                  <div className="font-medium">Prossimi passi</div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Contatta il team merchant per capire se serve un aggiornamento
                    del profilo, una riattivazione o un nuovo allineamento operativo.
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

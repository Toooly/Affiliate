import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { ApplicationForm } from "@/components/forms/application-form";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[960px] items-center justify-between px-4 py-5 lg:px-6">
        <Logo withTagline />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Torna alla home
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 pb-14 pt-6 lg:px-6">
        <div className="max-w-2xl space-y-4">
          <Badge variant="outline">Candidatura affiliato</Badge>
          <h1 className="ui-page-title-hero max-w-2xl">
            Candidati per accedere al portale affiliato.
          </h1>
          <p className="ui-page-copy max-w-xl">
            Gli utenti approvati ricevono un account affiliato operativo con codici promo, referral link, accesso alle campagne e tracking dei payout.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Candidatura</CardTitle>
            <p className="text-sm text-muted-foreground">
              Questo crea un account in attesa. Il merchant lo revisiona e lo attiva dalla cabina di regia.
            </p>
          </CardHeader>
          <CardContent>
            <ApplicationForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

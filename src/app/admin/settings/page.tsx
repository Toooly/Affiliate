import Link from "next/link";

import { Settings2, ShieldAlert, Store } from "lucide-react";

import { ProgramSettingsForm } from "@/components/forms/program-settings-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { RecordCard } from "@/components/shared/record-card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { isResendConfigured } from "@/lib/env";
import { formatPublicUrl } from "@/lib/utils";

export default async function AdminSettingsPage() {
  const [overview, suspiciousEvents] = await Promise.all([
    getRepository().getAdminOverview(),
    getRepository().listSuspiciousEvents("open"),
  ]);
  const emailSenderReady = isResendConfigured();

  return (
    <div className="ui-page-stack">
      <Card className="ui-card-hero">
        <CardContent className="p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="ui-surface-overline text-muted-foreground">
                <Settings2 className="size-4" />
                Impostazioni programma
              </div>
              <h2 className="ui-page-title mt-4">
                Governa coupon, antifrode, sender email e regole operative da un unico pannello.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                Questo pannello controlla le regole operative del programma affiliate:
                generazione coupon, protezioni di attribuzione, soglie di rischio e impostazioni
                email realmente usate dalle superfici attive del prodotto.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/store">
                <Store className="size-4" />
                Apri operazioni store
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AutoGrid minItemWidth="12rem" gap="md">
        <StatCard
          label="Segnalazioni frode aperte"
          value={String(overview.kpis.openFraudFlags)}
          hint="Indicatori attualmente in revisione"
          icon={ShieldAlert}
        />
        <StatCard
          label="Payout in attesa"
          value={String(overview.kpis.pendingPayouts)}
          hint="Record ancora non pagati"
          icon={Settings2}
        />
        <StatCard
          label="Destinazioni consentite"
          value={String(overview.programSettings.allowedDestinationUrls.length)}
          hint="Governate dal catalogo Shopify e dalla pagina store"
          icon={Settings2}
          emphasis
        />
        <StatCard
          label="Sender email"
          value={emailSenderReady ? "Attivo" : "Non attivo"}
          hint={
            emailSenderReady
              ? "Le notifiche automatiche possono partire davvero."
              : "Le email vengono saltate finché Resend non è configurato."
          }
          icon={Settings2}
        />
      </AutoGrid>

      <Card>
        <CardContent className="p-6 md:p-7">
          <ProgramSettingsForm initialValues={overview.programSettings} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6 md:p-7">
          <div>
            <div className="ui-surface-overline text-muted-foreground">
              Coda frodi aperta
            </div>
            <div className="ui-card-title mt-2">{suspiciousEvents.length} flag aperti</div>
          </div>
          {suspiciousEvents.length ? (
            suspiciousEvents.slice(0, 5).map((event) => (
              <RecordCard key={event.id} className="ui-surface-panel text-sm">
                <div className="font-medium">{event.title}</div>
                <div className="mt-1 text-muted-foreground">
                  {event.influencerName} / {event.detail}
                </div>
              </RecordCard>
            ))
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="Nessun flag aperto"
              description="Le segnalazioni appariranno qui solo quando i controlli reali del programma richiederanno una revisione."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6 md:p-7">
          <div>
            <div className="ui-surface-overline text-muted-foreground">
              Destinazioni governate dallo store
            </div>
            <div className="ui-card-title mt-2">
              {overview.programSettings.allowedDestinationUrls.length} URL attualmente abilitate
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Questa lista è di sola lettura: prodotti, collezioni e landing abilitate si governano
            dal catalogo Shopify sincronizzato nella pagina store, non da un secondo editor qui.
          </div>
          {overview.programSettings.allowedDestinationUrls.length ? (
            overview.programSettings.allowedDestinationUrls.map((destination) => (
              <RecordCard key={destination} className="ui-surface-panel ui-wrap-anywhere text-sm text-muted-foreground">
                {formatPublicUrl(destination)}
              </RecordCard>
            ))
          ) : (
            <EmptyState
              icon={Store}
              title="Nessuna destinazione configurata"
              description="Aggiungi almeno una destinazione reale prima di aprire la creazione dei referral link."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

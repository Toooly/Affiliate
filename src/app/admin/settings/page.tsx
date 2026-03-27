import Link from "next/link";

import { Settings2, ShieldAlert, Store } from "lucide-react";

import { ProgramSettingsForm } from "@/components/forms/program-settings-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { RecordCard } from "@/components/shared/record-card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";

export default async function AdminSettingsPage() {
  const [overview, suspiciousEvents] = await Promise.all([
    getRepository().getAdminOverview(),
    getRepository().listSuspiciousEvents("open"),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="ui-surface-overline text-muted-foreground">
                <Settings2 className="size-4" />
                Impostazioni programma
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Governa coupon, anti-leak, frodi, email white-label e feature flag da un unico
                pannello.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                Questo pannello controlla le regole operative del programma affiliate:
                generazione coupon, protezioni di attribuzione, soglie di rischio e readiness per
                payout automatici.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/store">
                <Store className="size-4" />
                Setup store
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
          hint="URL autorizzate per la creazione link"
          icon={Settings2}
          emphasis
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
            <div className="mt-2 text-lg font-semibold">{suspiciousEvents.length} flag aperti</div>
          </div>
          {suspiciousEvents.slice(0, 5).map((event) => (
            <RecordCard key={event.id} className="ui-surface-panel text-sm">
              <div className="font-medium">{event.title}</div>
              <div className="mt-1 text-muted-foreground">
                {event.influencerName} / {event.detail}
              </div>
            </RecordCard>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6 md:p-7">
          <div>
            <div className="ui-surface-overline text-muted-foreground">
              Destinazioni consentite
            </div>
            <div className="mt-2 text-lg font-semibold">
              {overview.programSettings.allowedDestinationUrls.length} URL configurate
            </div>
          </div>
          {overview.programSettings.allowedDestinationUrls.map((destination) => (
            <RecordCard key={destination} className="ui-surface-panel ui-wrap-anywhere text-sm text-muted-foreground">
              {destination}
            </RecordCard>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

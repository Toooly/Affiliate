import Link from "next/link";

import { Clock3 } from "lucide-react";

import { AffiliateInviteForm } from "@/components/forms/affiliate-invite-form";
import { ApplicationReviewCard } from "@/components/forms/application-review-card";
import { AutoGrid } from "@/components/shared/auto-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTile } from "@/components/shared/metric-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { formatShortDate, formatUiLabel } from "@/lib/utils";
import { applicationStatusFilterSchema } from "@/lib/validations";

type ApplicationsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function AdminApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const params = (await searchParams) ?? {};
  const status = applicationStatusFilterSchema.parse(params.status ?? "all");
  const [allApplications, applications, campaigns, invites] = await Promise.all([
    getRepository().listApplications("all"),
    getRepository().listApplications(status),
    getRepository().listCampaigns(),
    getRepository().listAffiliateInvites(),
  ]);
  const counts = {
    all: allApplications.length,
    pending: allApplications.filter((application) => application.status === "pending").length,
    approved: allApplications.filter((application) => application.status === "approved").length,
    rejected: allApplications.filter((application) => application.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <Card className="surface-admin">
        <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="ui-surface-pill">
              <Clock3 className="size-3.5" />
              Coda revisioni
            </div>
            <h2 className="ui-page-title mt-4 max-w-3xl">
              Valuta rapidamente le candidature e attiva gli affiliati giusti senza perdere il contesto di revisione.
            </h2>
          </div>
          <div className="ui-hero-aside">
            <AutoGrid minItemWidth="10rem">
              <MetricTile
                tone="surface"
                label="In attesa"
                value={counts.pending}
                density="hero"
              />
              <MetricTile
                tone="surface"
                label="Approvate"
                value={counts.approved}
                density="hero"
              />
            </AutoGrid>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Candidature visibili: {applications.length}</Badge>
            <Badge variant="outline">Filtro: {formatUiLabel(status)}</Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            {["all", "pending", "approved", "rejected"].map((value) => (
              <Button
                key={value}
                asChild
                variant={value === status ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/admin/applications?status=${value}`}>
                  {formatUiLabel(value)} ({counts[value as keyof typeof counts]})
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <div className="ui-surface-pill">Inviti affiliato</div>
              <h3 className="ui-page-title mt-4">
                Genera un link di onboarding ufficiale per trasformare un creator in affiliato attivo.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                L&apos;invito collega la registrazione al programma corretto, conserva l&apos;origine
                del lead e abilita l&apos;accesso partner senza passare da credenziali o percorsi
                improvvisati.
              </p>
            </div>

            <AffiliateInviteForm
              campaigns={campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="ui-surface-pill">Storico inviti</div>
                <div className="mt-3 text-lg font-semibold tracking-tight">
                  Ultimi link generati
                </div>
              </div>
              <Badge variant="outline">Totale: {invites.length}</Badge>
            </div>

            <div className="space-y-3">
              {invites.slice(0, 6).map((invite) => (
                <div key={invite.id} className="ui-panel-block">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">
                      {invite.invitedName ?? invite.invitedEmail ?? "Invito aperto"}
                    </div>
                    <Badge variant={invite.isClaimable ? "secondary" : "outline"}>
                      {invite.claimedAt
                        ? "Usato"
                        : invite.isExpired
                          ? "Scaduto"
                          : "Disponibile"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {invite.invitedEmail ?? "Link senza email vincolata"}
                    {invite.campaignName ? ` / ${invite.campaignName}` : ""}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Creato il {formatShortDate(invite.createdAt)}
                    {invite.claimedAffiliateName
                      ? ` / registrato da ${invite.claimedAffiliateName}`
                      : invite.expiresAt
                        ? ` / scade il ${formatShortDate(invite.expiresAt)}`
                        : ""}
                  </div>
                </div>
              ))}
              {!invites.length ? (
                <div className="ui-surface-panel border-dashed text-sm text-muted-foreground">
                  Nessun invito generato finora.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        {applications.length ? (
          applications.map((application) => (
            <ApplicationReviewCard
              key={application.id}
              application={application}
              campaigns={campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
              }))}
            />
          ))
        ) : (
          <EmptyState
            icon={Clock3}
            title="Nessuna candidatura nel filtro corrente"
            description="Le richieste di accesso compariranno qui solo dopo una registrazione reale o dopo l'uso di un invito affiliato."
          />
        )}
      </div>
    </div>
  );
}

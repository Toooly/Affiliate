import Link from "next/link";

import { Clock3 } from "lucide-react";

import { ApplicationReviewCard } from "@/components/forms/application-review-card";
import { MetricTile } from "@/components/shared/metric-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { formatUiLabel } from "@/lib/utils";
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
  const [allApplications, applications, campaigns] = await Promise.all([
    getRepository().listApplications("all"),
    getRepository().listApplications(status),
    getRepository().listCampaigns(),
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
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/75">
              <Clock3 className="size-3.5" />
              Coda revisioni
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Valuta rapidamente le candidature e attiva gli affiliati giusti senza perdere il contesto di revisione.
            </h2>
          </div>
          <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 md:min-w-[320px]">
            <MetricTile
              tone="surface"
              label="In attesa"
              value={counts.pending}
              className="min-h-[120px]"
            />
            <MetricTile
              tone="surface"
              label="Approvate"
              value={counts.approved}
              className="min-h-[120px]"
            />
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

      <div className="grid gap-6 xl:grid-cols-2">
        {applications.map((application) => (
          <ApplicationReviewCard
            key={application.id}
            application={application}
            campaigns={campaigns.map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
            }))}
          />
        ))}
      </div>
    </div>
  );
}

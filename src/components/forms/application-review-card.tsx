"use client";

import { ApplicationDecisionForm } from "@/components/forms/application-decision-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationListItem } from "@/lib/types";
import { formatUiLabel, timeAgo } from "@/lib/utils";

interface ApplicationReviewCardProps {
  application: ApplicationListItem;
  campaigns: Array<{ id: string; name: string }>;
}

export function ApplicationReviewCard({
  application,
  campaigns,
}: ApplicationReviewCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{application.fullName}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{application.email}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <span className="font-medium text-foreground">Piattaforma:</span>{" "}
            {formatUiLabel(application.primaryPlatform)}
          </div>
          <div>
            <span className="font-medium text-foreground">Pubblico:</span>{" "}
            {application.audienceSize}
          </div>
          <div>
            <span className="font-medium text-foreground">Paese:</span>{" "}
            {application.country}
          </div>
          <div>
            <span className="font-medium text-foreground">Nicchia:</span>{" "}
            {application.niche}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/80 bg-surface-soft px-3 py-1.5 text-foreground">
            Instagram: @{application.instagramHandle}
          </span>
          {application.tiktokHandle ? (
            <span className="rounded-full border border-border/80 bg-surface-soft px-3 py-1.5 text-foreground">
              TikTok: @{application.tiktokHandle}
            </span>
          ) : null}
          {application.youtubeHandle ? (
            <span className="rounded-full border border-border/80 bg-surface-soft px-3 py-1.5 text-foreground">
              YouTube: @{application.youtubeHandle}
            </span>
          ) : null}
        </div>
        <div className="ui-panel-block ui-panel-block-strong text-sm leading-6 text-muted-foreground">
          {application.message}
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="ui-surface-overline">
            Candidatura inviata {timeAgo(application.createdAt)}
          </div>
          {application.reviewerName ? (
            <div className="text-sm text-foreground">
              Revisionata da {application.reviewerName}
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ApplicationDecisionForm
            application={application}
            mode="approve"
            campaigns={campaigns}
          />
          <ApplicationDecisionForm application={application} mode="reject" />
        </div>
      </CardContent>
    </Card>
  );
}

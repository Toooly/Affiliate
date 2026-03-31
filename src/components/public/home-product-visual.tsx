import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspacePreview } from "@/components/public/workspace-preview";

const trustSignals = [
  {
    label: "Role-bound access",
    detail: "Ogni login entra solo nell'ambiente coerente con il ruolo.",
  },
  {
    label: "Approval-first onboarding",
    detail: "Le candidature passano da revisione prima di attivare dashboard e codice.",
  },
  {
    label: "Payout governance",
    detail: "Commission exposure, batch payout e stato partner restano sotto controllo.",
  },
];

export function HomeProductVisual() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
      <WorkspacePreview workspace="merchant" className="h-full" />

      <div className="grid gap-4">
        <WorkspacePreview workspace="affiliate" compact />

        <Card className="overflow-hidden rounded-[30px]">
          <CardContent className="p-5">
            <Badge variant="outline">Operational trust layer</Badge>
            <div className="mt-4 space-y-3">
              {trustSignals.map((item) => (
                <div key={item.label} className="ui-soft-block ui-soft-block-strong rounded-[22px] p-4">
                  <div className="ui-page-overline text-muted-foreground">{item.label}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

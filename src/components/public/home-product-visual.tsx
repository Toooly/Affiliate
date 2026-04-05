import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspacePreview } from "@/components/public/workspace-preview";

const trustSignals = [
  {
    label: "Accesso per ruolo",
    detail: "Ogni login entra solo nell'ambiente coerente con il ruolo.",
  },
  {
    label: "Onboarding con approvazione",
    detail: "Le candidature passano dalla revisione prima di attivare dashboard e codice.",
  },
  {
    label: "Controllo payout",
    detail: "Esposizione commissionale, batch payout e stato affiliato restano sotto controllo.",
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
            <Badge variant="outline">Controllo operativo</Badge>
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

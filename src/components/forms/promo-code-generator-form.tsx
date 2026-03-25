"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createPromoCodeAction } from "@/app/actions/influencer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { promoCodeCreateSchema } from "@/lib/validations";

type PromoCodeCreateValues = z.input<typeof promoCodeCreateSchema>;

interface PromoCodeGeneratorFormProps {
  allowGeneration: boolean;
  allowRequests: boolean;
  campaigns: Array<{ id: string; name: string }>;
}

export function PromoCodeGeneratorForm({
  allowGeneration,
  allowRequests,
  campaigns,
}: PromoCodeGeneratorFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<PromoCodeCreateValues>({
    resolver: zodResolver(promoCodeCreateSchema),
    defaultValues: {
      action: allowGeneration ? "generate" : "request",
      desiredCode: "",
      campaignId: null,
      requestMessage: "",
    },
  });
  const action = useWatch({
    control: form.control,
    name: "action",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPromoCodeAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        ...form.getValues(),
        desiredCode: "",
        requestMessage: "",
      });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-[28px] border border-border/70 bg-secondary/35 p-5">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
          Workflow codici promo
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Genera un codice subito quando il programma lo consente, oppure invia una richiesta quando serve approvazione manuale.
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Azione</Label>
            <Select
              defaultValue={form.getValues("action")}
              onValueChange={(value) =>
                form.setValue("action", value as PromoCodeCreateValues["action"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowGeneration ? <SelectItem value="generate">Genera nuovo codice</SelectItem> : null}
                {allowRequests ? <SelectItem value="request">Richiedi approvazione</SelectItem> : null}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Campagna</Label>
            <Select
              defaultValue={form.getValues("campaignId") ?? "none"}
              onValueChange={(value) =>
                form.setValue("campaignId", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Campagna opzionale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nessuna campagna</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="desired-code">Codice preferito</Label>
            <Input id="desired-code" placeholder="AFF-LUNA-EDIT" {...form.register("desiredCode")} />
          </div>
          {action === "request" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="request-message">Nota per la richiesta</Label>
              <Textarea
                id="request-message"
                placeholder="Spiega perche ti serve un codice dedicato a questa campagna."
                {...form.register("requestMessage")}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[28px] border border-border/70 bg-background/72 p-5">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Riepilogo policy
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-[20px] border border-border/70 bg-white p-4 text-sm">
            <div className="text-muted-foreground">Generazione self-service</div>
            <div className="mt-1 font-medium">{allowGeneration ? "Attiva" : "Disattivata"}</div>
          </div>
          <div className="rounded-[20px] border border-border/70 bg-white p-4 text-sm">
            <div className="text-muted-foreground">Flusso richiesta</div>
            <div className="mt-1 font-medium">{allowRequests ? "Attivo" : "Disattivato"}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || (!allowGeneration && !allowRequests)}>
          {isPending
            ? "Salvataggio..."
            : action === "generate"
              ? "Genera codice promo"
              : "Invia richiesta"}
        </Button>
      </div>
    </form>
  );
}

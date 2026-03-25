"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createReferralLinkAction } from "@/app/actions/influencer";
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
import { referralLinkSchema } from "@/lib/validations";

type ReferralLinkFormValues = z.input<typeof referralLinkSchema>;

interface ReferralLinkFormProps {
  allowedDestinations: string[];
  campaigns: Array<{ id: string; name: string }>;
}

export function ReferralLinkForm({
  allowedDestinations,
  campaigns,
}: ReferralLinkFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ReferralLinkFormValues>({
    resolver: zodResolver(referralLinkSchema),
    defaultValues: {
      name: "",
      destinationUrl: allowedDestinations[0] ?? "",
      campaignId: null,
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
    },
  });
  const watchedName = useWatch({
    control: form.control,
    name: "name",
  });
  const watchedDestination = useWatch({
    control: form.control,
    name: "destinationUrl",
  });
  const watchedUtmSource = useWatch({
    control: form.control,
    name: "utmSource",
  });
  const watchedUtmMedium = useWatch({
    control: form.control,
    name: "utmMedium",
  });
  const watchedUtmCampaign = useWatch({
    control: form.control,
    name: "utmCampaign",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createReferralLinkAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        ...form.getValues(),
        name: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
      });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-[28px] border border-border/70 bg-secondary/35 p-5">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
          Configurazione link
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Dai a ogni link un obiettivo chiaro, cosi potrai leggere le performance per formato, canale o campagna.
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="link-name">Nome link</Label>
            <Input id="link-name" placeholder="CTA reel lancio primavera" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-destination">URL di destinazione</Label>
            <Input
              id="link-destination"
              list="allowed-destination-options"
              {...form.register("destinationUrl")}
            />
            <datalist id="allowed-destination-options">
              {allowedDestinations.map((destination) => (
                <option key={destination} value={destination} />
              ))}
            </datalist>
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
        </div>
      </div>

      <div className="rounded-[28px] border border-border/70 bg-background/72 p-5">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
          Parametri UTM opzionali
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          I valori UTM si aggiungono alla destinazione per mantenere allineati analytics store e attribuzione affiliate.
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="utm-source">UTM source</Label>
            <Input id="utm-source" placeholder="instagram" {...form.register("utmSource")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utm-medium">UTM medium</Label>
            <Input id="utm-medium" placeholder="story" {...form.register("utmMedium")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="utm-campaign">UTM campaign</Label>
            <Input id="utm-campaign" placeholder="spring-drop" {...form.register("utmCampaign")} />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border/70 bg-background/72 p-5">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Anteprima
        </div>
        <div className="mt-3 text-sm text-foreground">
          Nome: <span className="font-medium">{watchedName || "Link operativo senza titolo"}</span>
        </div>
        <div className="mt-2 break-all text-sm text-muted-foreground">
          Destinazione: {watchedDestination || "Seleziona un URL di destinazione"}
        </div>
        {watchedUtmSource || watchedUtmMedium || watchedUtmCampaign ? (
          <div className="mt-2 text-sm text-muted-foreground">
            UTM: {[watchedUtmSource, watchedUtmMedium, watchedUtmCampaign].filter(Boolean).join(" / ")}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creazione..." : "Crea link referral"}
        </Button>
      </div>
    </form>
  );
}

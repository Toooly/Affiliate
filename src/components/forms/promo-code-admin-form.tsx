"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { assignPromoCodeAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminPromoCodeSchema } from "@/lib/validations";

type AdminPromoCodeValues = z.input<typeof adminPromoCodeSchema>;

interface PromoCodeAdminFormProps {
  influencers: Array<{ id: string; fullName: string }>;
  campaigns: Array<{ id: string; name: string }>;
  defaultInfluencerId?: string;
  hideInfluencerField?: boolean;
  defaultCampaignId?: string | null;
  hideCampaignField?: boolean;
}

export function PromoCodeAdminForm({
  influencers,
  campaigns,
  defaultInfluencerId,
  hideInfluencerField = false,
  defaultCampaignId = null,
  hideCampaignField = false,
}: PromoCodeAdminFormProps) {
  const initialInfluencerId = defaultInfluencerId ?? influencers[0]?.id ?? "";
  const [isPending, startTransition] = useTransition();
  const form = useForm<AdminPromoCodeValues>({
    resolver: zodResolver(adminPromoCodeSchema),
    defaultValues: {
      influencerId: initialInfluencerId,
      code: "",
      campaignId: defaultCampaignId,
      discountValue: 10,
      isPrimary: false,
    },
  });
  const isPrimary = useWatch({
    control: form.control,
    name: "isPrimary",
  });
  const autoGenerate =
    useWatch({
      control: form.control,
      name: "code",
    }) === "";

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await assignPromoCodeAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        ...form.getValues(),
        code: "",
        isPrimary: false,
      });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {!hideInfluencerField ? (
          <div className="space-y-2">
            <Label>Affiliato</Label>
            <Select
              defaultValue={form.getValues("influencerId")}
              onValueChange={(value) => form.setValue("influencerId", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {influencers.map((influencer) => (
                  <SelectItem key={influencer.id} value={influencer.id}>
                    {influencer.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="admin-code">Codice promo</Label>
          <Input
            id="admin-code"
            placeholder={autoGenerate ? "Il codice verrà generato automaticamente" : "AFF-LUNA-SALE"}
            {...form.register("code")}
          />
          <div className="text-xs text-muted-foreground">
            Lascia vuoto per generare un codice univoco a partire da affiliato e prefisso
            programma.
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-discount">Sconto %</Label>
          <Input
            id="admin-discount"
            type="number"
            step="0.01"
            {...form.register("discountValue", { valueAsNumber: true })}
          />
        </div>
        {!hideCampaignField ? (
          <div className="space-y-2">
            <Label>Campagna</Label>
            <Select
              defaultValue={form.getValues("campaignId") ?? "none"}
              onValueChange={(value) =>
                form.setValue("campaignId", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Campagna facoltativa" />
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
        ) : null}
      </div>
      <label className="ui-field-toggle rounded-[24px]">
        <Checkbox
          checked={isPrimary}
          onCheckedChange={(checked) =>
            form.setValue("isPrimary", Boolean(checked), { shouldValidate: true })
          }
        />
        <span className="text-sm text-muted-foreground">
          Imposta questo come codice principale dell&apos;affiliato.
        </span>
      </label>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Assegnazione..." : "Assegna codice promo"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createCampaignAction, updateCampaignAction } from "@/app/actions/admin";
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
import { Textarea } from "@/components/ui/textarea";
import { campaignSchema } from "@/lib/validations";

type CampaignValues = z.input<typeof campaignSchema>;

const todayIso = new Date().toISOString().slice(0, 10);
const defaultCampaignEndDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 21)
  .toISOString()
  .slice(0, 10);

interface CampaignFormProps {
  allowedDestinations: string[];
  influencers: Array<{ id: string; fullName: string }>;
  initialValues?: Partial<CampaignValues>;
  mode?: "create" | "edit";
  submitLabel?: string;
}

export function CampaignForm({
  allowedDestinations,
  influencers,
  initialValues,
  mode = "create",
  submitLabel,
}: CampaignFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CampaignValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      id: initialValues?.id,
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      landingUrl: initialValues?.landingUrl ?? allowedDestinations[0] ?? "",
      startDate: initialValues?.startDate?.slice(0, 10) ?? todayIso,
      endDate: initialValues?.endDate?.slice(0, 10) ?? defaultCampaignEndDate,
      status: initialValues?.status ?? "draft",
      commissionType: initialValues?.commissionType ?? "default",
      commissionValue:
        typeof initialValues?.commissionValue === "number"
          ? initialValues.commissionValue
          : null,
      bonusTitle: initialValues?.bonusTitle ?? "",
      bonusDescription: initialValues?.bonusDescription ?? "",
      bonusType: initialValues?.bonusType ?? null,
      bonusValue:
        typeof initialValues?.bonusValue === "number" ? initialValues.bonusValue : null,
      appliesToAll: initialValues?.appliesToAll ?? true,
      affiliateIds: initialValues?.affiliateIds ?? [],
    },
  });
  const commissionType = useWatch({
    control: form.control,
    name: "commissionType",
  });
  const landingUrl = useWatch({
    control: form.control,
    name: "landingUrl",
  });
  const appliesToAll = useWatch({
    control: form.control,
    name: "appliesToAll",
  });
  const affiliateIds =
    useWatch({
      control: form.control,
      name: "affiliateIds",
    }) ?? [];

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === "edit"
          ? await updateCampaignAction(values)
          : await createCampaignAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      if (mode === "create") {
        form.reset({
          id: undefined,
          name: "",
          description: "",
          landingUrl: allowedDestinations[0] ?? "",
          startDate: todayIso,
          endDate: defaultCampaignEndDate,
          status: "draft",
          commissionType: "default",
          commissionValue: null,
          bonusTitle: "",
          bonusDescription: "",
          bonusType: null,
          bonusValue: null,
          appliesToAll: true,
          affiliateIds: [],
        });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="campaign-name">Nome campagna</Label>
          <Input id="campaign-name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label>URL di destinazione</Label>
          <Select
            value={landingUrl || undefined}
            onValueChange={(value) =>
              form.setValue("landingUrl", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona una destinazione valida" />
            </SelectTrigger>
            <SelectContent>
              {allowedDestinations.map((destination) => (
                <SelectItem key={destination} value={destination}>
                  {destination}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="campaign-description">Descrizione</Label>
          <Textarea id="campaign-description" {...form.register("description")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-start">Data di inizio</Label>
          <Input id="campaign-start" type="date" {...form.register("startDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-end">Data di fine</Label>
          <Input id="campaign-end" type="date" {...form.register("endDate")} />
        </div>
        <div className="space-y-2">
          <Label>Stato</Label>
          <Select
            defaultValue={form.getValues("status")}
            onValueChange={(value) => form.setValue("status", value as CampaignValues["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Bozza</SelectItem>
              <SelectItem value="scheduled">Pianificata</SelectItem>
              <SelectItem value="active">Attiva</SelectItem>
              <SelectItem value="ended">Terminata</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Regola commissionale</Label>
          <Select
            defaultValue={form.getValues("commissionType")}
            onValueChange={(value) =>
              form.setValue("commissionType", value as CampaignValues["commissionType"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Usa il modello del programma</SelectItem>
              <SelectItem value="percentage">Percentuale personalizzata</SelectItem>
              <SelectItem value="fixed">Importo fisso personalizzato</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {commissionType !== "default" ? (
          <div className="space-y-2">
            <Label htmlFor="campaign-commission">Valore commissione</Label>
            <Input
              id="campaign-commission"
              type="number"
              step="0.01"
              {...form.register("commissionValue", { valueAsNumber: true })}
            />
          </div>
        ) : null}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="campaign-bonus-title">Titolo bonus o reward</Label>
          <Input
            id="campaign-bonus-title"
            placeholder="Premio opzionale legato alla campagna"
            {...form.register("bonusTitle")}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="campaign-bonus-description">Descrizione bonus</Label>
          <Textarea
            id="campaign-bonus-description"
            placeholder="Spiega il premio previsto: bonus cash, gift, credito store o boost commissionale."
            {...form.register("bonusDescription")}
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo bonus</Label>
          <Select
            defaultValue={form.getValues("bonusType") ?? "none"}
            onValueChange={(value) =>
              form.setValue(
                "bonusType",
                value === "none" ? null : (value as CampaignValues["bonusType"]),
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Reward opzionale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessun bonus</SelectItem>
              <SelectItem value="cash_bonus">Bonus cash</SelectItem>
              <SelectItem value="gift">Gift</SelectItem>
              <SelectItem value="store_credit">Credito store</SelectItem>
              <SelectItem value="commission_boost">Boost commissionale</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-bonus-value">Valore bonus</Label>
          <Input
            id="campaign-bonus-value"
            type="number"
            step="0.01"
            {...form.register("bonusValue", { valueAsNumber: true })}
          />
        </div>
      </div>
      <label className="ui-panel-block flex items-center gap-3">
        <Checkbox
          checked={appliesToAll}
          onCheckedChange={(checked) => {
            const enabled = Boolean(checked);
            form.setValue("appliesToAll", enabled, { shouldValidate: true });

            if (enabled) {
              form.setValue("affiliateIds", [], { shouldValidate: true });
            }
          }}
        />
        <span className="text-sm text-muted-foreground">
          Assegna questa campagna a tutti gli affiliati per impostazione predefinita.
        </span>
      </label>
      {!appliesToAll ? (
        <div className="ui-panel-block">
          <div className="ui-surface-overline">
            Assegnazione affiliati
          </div>
          <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
            {influencers.map((influencer) => {
              const selected = affiliateIds.includes(influencer.id);

              return (
                <label
                  key={influencer.id}
                  className="ui-panel-block flex items-center gap-3"
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? Array.from(new Set([...affiliateIds, influencer.id]))
                        : affiliateIds.filter((id) => id !== influencer.id);
                      form.setValue("affiliateIds", next, { shouldValidate: true });
                    }}
                  />
                  <span className="text-sm font-medium">{influencer.fullName}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Seleziona gli affiliati che devono ricevere questo pacchetto campagna.
          </p>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === "edit"
              ? "Salvataggio..."
              : "Creazione..."
            : submitLabel ?? (mode === "edit" ? "Salva modifiche campagna" : "Crea campagna")}
        </Button>
      </div>
    </form>
  );
}

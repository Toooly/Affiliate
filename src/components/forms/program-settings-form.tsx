"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateProgramSettingsAction } from "@/app/actions/admin";
import { AutoGrid } from "@/components/shared/auto-grid";
import { SettingToggleCard } from "@/components/shared/setting-toggle-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProgramSettings } from "@/lib/types";
import { programSettingsSchema } from "@/lib/validations";

type ProgramSettingsValues = z.input<typeof programSettingsSchema>;

interface ProgramSettingsFormProps {
  initialValues: ProgramSettings;
}

export function ProgramSettingsForm({ initialValues }: ProgramSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProgramSettingsValues>({
    resolver: zodResolver(programSettingsSchema),
    defaultValues: {
      allowAffiliateCodeGeneration: initialValues.allowAffiliateCodeGeneration,
      allowPromoCodeRequests: initialValues.allowPromoCodeRequests,
      allowCustomLinkDestinations: initialValues.allowCustomLinkDestinations,
      promoCodePrefix: initialValues.promoCodePrefix,
      emailBrandName: initialValues.emailBrandName,
      emailReplyTo: initialValues.emailReplyTo,
      antiLeakEnabled: initialValues.antiLeakEnabled,
      blockSelfReferrals: initialValues.blockSelfReferrals,
      requireCodeOwnershipMatch: initialValues.requireCodeOwnershipMatch,
      fraudReviewEnabled: initialValues.fraudReviewEnabled,
      maxClicksPerIpPerDay: initialValues.maxClicksPerIpPerDay,
      maxConversionsPerIpPerDay: initialValues.maxConversionsPerIpPerDay,
      enableRewards: initialValues.enableRewards,
      enableStoreCredit: initialValues.enableStoreCredit,
      enableMarketplace: initialValues.enableMarketplace,
      enableMultiLevel: initialValues.enableMultiLevel,
      enableMultiProgram: initialValues.enableMultiProgram,
      enableAutoPayouts: initialValues.enableAutoPayouts,
      allowedDestinationUrls: initialValues.allowedDestinationUrls,
    },
  });

  const allowAffiliateCodeGeneration = useWatch({
    control: form.control,
    name: "allowAffiliateCodeGeneration",
  });
  const allowPromoCodeRequests = useWatch({
    control: form.control,
    name: "allowPromoCodeRequests",
  });
  const antiLeakEnabled = useWatch({
    control: form.control,
    name: "antiLeakEnabled",
  });
  const blockSelfReferrals = useWatch({
    control: form.control,
    name: "blockSelfReferrals",
  });
  const requireCodeOwnershipMatch = useWatch({
    control: form.control,
    name: "requireCodeOwnershipMatch",
  });
  const fraudReviewEnabled = useWatch({
    control: form.control,
    name: "fraudReviewEnabled",
  });
  const allowCustomLinkDestinations = useWatch({
    control: form.control,
    name: "allowCustomLinkDestinations",
  });
  const enableRewards = useWatch({
    control: form.control,
    name: "enableRewards",
  });
  const enableStoreCredit = useWatch({
    control: form.control,
    name: "enableStoreCredit",
  });
  const enableMarketplace = useWatch({
    control: form.control,
    name: "enableMarketplace",
  });
  const enableMultiLevel = useWatch({
    control: form.control,
    name: "enableMultiLevel",
  });
  const enableMultiProgram = useWatch({
    control: form.control,
    name: "enableMultiProgram",
  });
  const enableAutoPayouts = useWatch({
    control: form.control,
    name: "enableAutoPayouts",
  });
  const allowedDestinationUrls = useWatch({
    control: form.control,
    name: "allowedDestinationUrls",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateProgramSettingsAction(values);

      if (result.ok) {
        toast.success(result.message);
        return;
      }

      toast.error(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,30rem),1fr))]">
        <div className="space-y-4">
          <div className="ui-surface-overline">
            Regole codici promo
          </div>
          <SettingToggleCard
            checked={allowAffiliateCodeGeneration}
            onChange={(checked) =>
              form.setValue("allowAffiliateCodeGeneration", checked, {
                shouldValidate: true,
              })
            }
            label="Generazione automatica codici"
            description="Permette agli affiliati di creare nuovi codici promo in autonomia."
          />
          <SettingToggleCard
            checked={allowPromoCodeRequests}
            onChange={(checked) =>
              form.setValue("allowPromoCodeRequests", checked, {
                shouldValidate: true,
              })
            }
            label="Richieste codice promo"
            description="Mantiene attivo il flusso di richiesta quando serve approvazione manuale."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promo-prefix">Prefisso codici</Label>
              <Input id="promo-prefix" {...form.register("promoCodePrefix")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-brand-name">Nome brand email</Label>
              <Input id="email-brand-name" {...form.register("emailBrandName")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-reply-to">Email reply-to</Label>
            <Input id="email-reply-to" type="email" {...form.register("emailReplyTo")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allowed-destinations">URL di destinazione consentiti</Label>
            <Textarea
              id="allowed-destinations"
              value={(allowedDestinationUrls ?? []).join("\n")}
              onChange={(event) =>
                form.setValue(
                  "allowedDestinationUrls",
                  event.target.value
                    .split("\n")
                    .map((value) => value.trim())
                    .filter(Boolean),
                  { shouldValidate: true },
                )
              }
              placeholder="https://example.com/shop&#10;https://example.com/products"
            />
            <p className="text-sm text-muted-foreground">
              Una URL per riga. Gli affiliati potranno creare link solo verso queste destinazioni approvate.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="ui-surface-overline">
            Controlli rischio
          </div>
          <SettingToggleCard
            checked={antiLeakEnabled}
            onChange={(checked) =>
              form.setValue("antiLeakEnabled", checked, { shouldValidate: true })
            }
            label="Protezione anti-leak"
            description="Applica controlli piu rigorosi sull'attribuzione coupon e sul comportamento sospetto."
          />
          <SettingToggleCard
            checked={blockSelfReferrals}
            onChange={(checked) =>
              form.setValue("blockSelfReferrals", checked, { shouldValidate: true })
            }
            label="Blocca self-referral"
            description="Segnala gli ordini in cui l'email cliente coincide con quella dell'affiliato."
          />
          <SettingToggleCard
            checked={requireCodeOwnershipMatch}
            onChange={(checked) =>
              form.setValue("requireCodeOwnershipMatch", checked, {
                shouldValidate: true,
              })
            }
            label="Controllo proprieta codice"
            description="Impedisce l'uso di codici promo che appartengono a un affiliato diverso."
          />
          <SettingToggleCard
            checked={fraudReviewEnabled}
            onChange={(checked) =>
              form.setValue("fraudReviewEnabled", checked, { shouldValidate: true })
            }
            label="Review frodi attiva"
            description="Genera e mantiene flag sospetti per la revisione amministrativa."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-clicks-ip">Click max per IP al giorno</Label>
              <Input
                id="max-clicks-ip"
                type="number"
                {...form.register("maxClicksPerIpPerDay", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-conversions-ip">Conversioni max per IP al giorno</Label>
              <Input
                id="max-conversions-ip"
                type="number"
                {...form.register("maxConversionsPerIpPerDay", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="ui-surface-overline">
          Feature flag prodotto
        </div>
        <AutoGrid minItemWidth="15rem" gap="md">
          <SettingToggleCard
            checked={allowCustomLinkDestinations}
            onChange={(checked) =>
              form.setValue("allowCustomLinkDestinations", checked, {
                shouldValidate: true,
              })
            }
            label="Destinazioni link custom"
            description="Permette URL personalizzati approvati oltre alle destinazioni predefinite."
          />
          <SettingToggleCard
            checked={enableRewards}
            onChange={(checked) =>
              form.setValue("enableRewards", checked, { shouldValidate: true })
            }
            label="Reward e bonus"
            description="Abilita bonus campagna, gift e tracking dei reward."
          />
          <SettingToggleCard
            checked={enableStoreCredit}
            onChange={(checked) =>
              form.setValue("enableStoreCredit", checked, {
                shouldValidate: true,
              })
            }
            label="Store credit ready"
            description="Mantiene pronta l'architettura per reward in credito store."
          />
          <SettingToggleCard
            checked={enableMarketplace}
            onChange={(checked) =>
              form.setValue("enableMarketplace", checked, {
                shouldValidate: true,
              })
            }
            label="Marketplace ready"
            description="Prepara il sistema a una futura esperienza discovery o marketplace."
          />
          <SettingToggleCard
            checked={enableMultiLevel}
            onChange={(checked) =>
              form.setValue("enableMultiLevel", checked, {
                shouldValidate: true,
              })
            }
            label="Multi-level ready"
            description="Feature flag per un futuro modello referral multilivello."
          />
          <SettingToggleCard
            checked={enableMultiProgram}
            onChange={(checked) =>
              form.setValue("enableMultiProgram", checked, {
                shouldValidate: true,
              })
            }
            label="Multi-program ready"
            description="Feature flag per supportare piu programmi o store distinti."
          />
          <SettingToggleCard
            checked={enableAutoPayouts}
            onChange={(checked) =>
              form.setValue("enableAutoPayouts", checked, {
                shouldValidate: true,
              })
            }
            label="Auto payout ready"
            description="Prepara le payout operations all'integrazione automatica con provider esterni."
          />
        </AutoGrid>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Salva impostazioni"}
        </Button>
      </div>
    </form>
  );
}

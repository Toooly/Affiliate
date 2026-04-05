"use client";

import { useEffect, useTransition } from "react";

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
  const enableRewards = useWatch({
    control: form.control,
    name: "enableRewards",
  });

  useEffect(() => {
    form.register("allowCustomLinkDestinations");
    form.register("enableStoreCredit");
    form.register("enableMarketplace");
    form.register("enableMultiLevel");
    form.register("enableMultiProgram");
    form.register("enableAutoPayouts");
    form.register("allowedDestinationUrls");
  }, [form]);

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
          <div className="ui-surface-overline">Regole codici promo</div>
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
            description="Mantiene attivo il flusso di richiesta quando serve approvazione merchant."
          />
          <SettingToggleCard
            checked={enableRewards}
            onChange={(checked) =>
              form.setValue("enableRewards", checked, { shouldValidate: true })
            }
            label="Reward e bonus campagna"
            description="Abilita bonus campagna, gift e reward visibili nelle superfici oggi operative."
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
        </div>

        <div className="space-y-4">
          <div className="ui-surface-overline">Controlli rischio</div>
          <SettingToggleCard
            checked={antiLeakEnabled}
            onChange={(checked) =>
              form.setValue("antiLeakEnabled", checked, { shouldValidate: true })
            }
            label="Protezione anti-leak"
            description="Applica controlli più rigorosi sull'attribuzione coupon e sul comportamento sospetto."
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
            label="Controllo proprietà codice"
            description="Impedisce l'uso di codici promo che appartengono a un affiliato diverso."
          />
          <SettingToggleCard
            checked={fraudReviewEnabled}
            onChange={(checked) =>
              form.setValue("fraudReviewEnabled", checked, { shouldValidate: true })
            }
            label="Revisione frodi attiva"
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
        <div className="ui-surface-overline">Superfici governate altrove</div>
        <AutoGrid minItemWidth="15rem" gap="md">
          <div className="ui-panel-block ui-panel-block-strong text-sm">
            <div className="font-medium">Destinazioni store</div>
            <div className="mt-2 text-muted-foreground">
              Le URL consentite non si modificano più qui: seguono il catalogo Shopify sincronizzato e la governance della pagina store.
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {initialValues.allowedDestinationUrls.length} destinazioni già presenti nel programma.
            </div>
          </div>
          <div className="ui-panel-block ui-panel-block-strong text-sm">
            <div className="font-medium">Capacità avanzate</div>
            <div className="mt-2 text-muted-foreground">
              Multi-program, marketplace, payout automatici e varianti avanzate restano fuori dalla UI finché non sostengono un flusso reale dell&apos;app.
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Questo evita toggle visibili che oggi non cambiano il comportamento del prodotto.
            </div>
          </div>
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

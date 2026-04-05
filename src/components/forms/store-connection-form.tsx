"use client";

import { useEffect, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateStoreConnectionAction } from "@/app/actions/admin";
import { SettingToggleCard } from "@/components/shared/setting-toggle-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SHOPIFY_SCOPE_OPTIONS } from "@/lib/constants";
import type { StoreConnection } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storeConnectionSchema } from "@/lib/validations";

type StoreConnectionValues = z.input<typeof storeConnectionSchema>;

interface StoreConnectionFormProps {
  initialValues: StoreConnection;
  catalogItemCount: number;
}

export function StoreConnectionForm({
  initialValues,
  catalogItemCount,
}: StoreConnectionFormProps) {
  const [isPending, startTransition] = useTransition();
  const normalizedGrantedScopes = initialValues.grantedScopes.filter((scope) =>
    SHOPIFY_SCOPE_OPTIONS.some((option) => option.value === scope),
  ) as StoreConnectionValues["grantedScopes"];
  const form = useForm<StoreConnectionValues>({
    resolver: zodResolver(storeConnectionSchema),
    defaultValues: {
      storeName: initialValues.storeName,
      shopDomain: initialValues.shopDomain,
      storefrontUrl: initialValues.storefrontUrl,
      defaultDestinationUrl: initialValues.defaultDestinationUrl,
      installState: initialValues.installState,
      status: initialValues.status,
      syncProductsEnabled: initialValues.syncProductsEnabled,
      syncDiscountCodesEnabled: initialValues.syncDiscountCodesEnabled,
      orderAttributionEnabled: initialValues.orderAttributionEnabled,
      autoCreateDiscountCodes: initialValues.autoCreateDiscountCodes,
      appEmbedEnabled: initialValues.appEmbedEnabled,
      grantedScopes: normalizedGrantedScopes,
    },
  });

  const installState = useWatch({
    control: form.control,
    name: "installState",
  });
  const status = useWatch({
    control: form.control,
    name: "status",
  });
  const syncProductsEnabled = useWatch({
    control: form.control,
    name: "syncProductsEnabled",
  });
  const syncDiscountCodesEnabled = useWatch({
    control: form.control,
    name: "syncDiscountCodesEnabled",
  });
  const orderAttributionEnabled = useWatch({
    control: form.control,
    name: "orderAttributionEnabled",
  });
  const autoCreateDiscountCodes = useWatch({
    control: form.control,
    name: "autoCreateDiscountCodes",
  });
  const appEmbedEnabled = useWatch({
    control: form.control,
    name: "appEmbedEnabled",
  });
  const grantedScopes = useWatch({
    control: form.control,
    name: "grantedScopes",
    defaultValue: form.getValues("grantedScopes"),
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateStoreConnectionAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  });

  const missingScopes = SHOPIFY_SCOPE_OPTIONS.filter(
    (scope) => !grantedScopes.includes(scope.value),
  );

  useEffect(() => {
    form.register("installState");
    form.register("status");
    form.register("appEmbedEnabled");
    form.register("grantedScopes");

    if (catalogItemCount > 0) {
      form.register("defaultDestinationUrl");
    }
  }, [catalogItemCount, form]);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="store-name">Nome store</Label>
          <Input id="store-name" {...form.register("storeName")} />
          <p className="text-sm text-destructive">{form.formState.errors.storeName?.message}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-domain">Dominio Shopify</Label>
          <Input
            id="shop-domain"
            placeholder="nome-store.myshopify.com"
            {...form.register("shopDomain")}
          />
          <p className="text-sm text-destructive">{form.formState.errors.shopDomain?.message}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="storefront-url">URL storefront</Label>
          <Input id="storefront-url" {...form.register("storefrontUrl")} />
          <p className="text-sm text-destructive">
            {form.formState.errors.storefrontUrl?.message}
          </p>
        </div>
        {catalogItemCount === 0 ? (
          <div className="space-y-2">
            <Label htmlFor="default-destination-url">Destinazione Shopify predefinita</Label>
            <Input id="default-destination-url" {...form.register("defaultDestinationUrl")} />
            <p className="text-sm text-destructive">
              {form.formState.errors.defaultDestinationUrl?.message}
            </p>
          </div>
        ) : (
          <div className="ui-panel-block ui-panel-block-strong">
            <div className="text-sm font-medium">Destinazione predefinita</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Con il catalogo già sincronizzato, la destinazione predefinita si governa dalla sezione
              &quot;Governance destinazioni&quot; qui sotto per evitare doppie fonti di verità.
            </div>
            <div className="ui-wrap-anywhere mt-3 text-sm">{form.getValues("defaultDestinationUrl")}</div>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-4">
          <div className="ui-panel-block ui-panel-block-strong">
            <div className="text-sm font-medium">Stato reale integrazione</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={installState} />
              <StatusBadge status={status} />
              <StatusBadge status={appEmbedEnabled ? "ready" : "missing"} />
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Installazione, connessione, scope concessi e theme app embed derivano dal bridge Shopify reale e non sono più modificabili manualmente da questo form.
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {installState === "installed" && status === "connected"
                ? "Il backend considera la connessione utilizzabile. Da qui puoi governare solo configurazioni merchant e preferenze operative."
                : installState === "reauth_required"
                  ? "Serve una nuova autorizzazione OAuth prima di riaprire i flussi store."
                  : "Completa l'installazione OAuth o il riallineamento del bridge per far evolvere questo stato."}
            </div>
          </div>

          <div className="ui-panel-block">
            <div className="text-sm font-medium">Permessi e tracking</div>
            <div className="mt-3 grid gap-2">
              {SHOPIFY_SCOPE_OPTIONS.map((scope) => {
                const granted = grantedScopes.includes(scope.value);

                return (
                  <div
                    key={scope.value}
                    className="flex items-start justify-between gap-4 ui-surface-panel"
                  >
                    <div>
                      <div className="text-sm font-medium">{scope.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {scope.description}
                      </div>
                    </div>
                    <StatusBadge status={granted ? "granted" : "missing"} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {missingScopes.length
                ? `${missingScopes.length} scope mancanti impediscono ancora parte dei flussi catalogo, sconti o ordini.`
                : "Gli scope Shopify richiesti risultano già concessi."}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <SettingToggleCard
            checked={Boolean(syncProductsEnabled)}
            onChange={(checked) =>
              form.setValue("syncProductsEnabled", checked, { shouldValidate: true })
            }
            label="Catalogo prodotti attivo"
            description="Abilita la sincronizzazione del catalogo Shopify usato nei referral link e nelle destinazioni approvate."
          />
          <SettingToggleCard
            checked={Boolean(syncDiscountCodesEnabled)}
            onChange={(checked) =>
              form.setValue("syncDiscountCodesEnabled", checked, {
                shouldValidate: true,
              })
            }
            label="Governance codici attiva"
            description="Mantiene allineata la governance dei codici promo con la disponibilità dei flussi Shopify dedicati."
          />
          <SettingToggleCard
            checked={Boolean(orderAttributionEnabled)}
            onChange={(checked) =>
              form.setValue("orderAttributionEnabled", checked, {
                shouldValidate: true,
              })
            }
            label="Attribuzione ordini"
            description="Indica che link e coupon devono alimentare la logica commissionale basata sugli eventi ordine Shopify."
          />
          <SettingToggleCard
            checked={Boolean(autoCreateDiscountCodes)}
            onChange={(checked) =>
              form.setValue("autoCreateDiscountCodes", checked, {
                shouldValidate: true,
              })
            }
            label="Automazione codici sconto"
            description="Prepara l'area merchant a generare coupon a partire da approvazioni e richieste affiliate."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Salva dettagli integrazione"}
        </Button>
      </div>
    </form>
  );
}

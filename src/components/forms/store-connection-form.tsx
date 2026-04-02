"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateStoreConnectionAction } from "@/app/actions/admin";
import { SettingToggleCard } from "@/components/shared/setting-toggle-card";
import { SHOPIFY_SCOPE_OPTIONS } from "@/lib/constants";
import type { StoreConnection } from "@/lib/types";
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
import { storeConnectionSchema } from "@/lib/validations";

type StoreConnectionValues = z.input<typeof storeConnectionSchema>;

interface StoreConnectionFormProps {
  initialValues: StoreConnection;
}

export function StoreConnectionForm({
  initialValues,
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
          <Input id="shop-domain" placeholder="nome-store.myshopify.com" {...form.register("shopDomain")} />
          <p className="text-sm text-destructive">{form.formState.errors.shopDomain?.message}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="storefront-url">URL storefront</Label>
          <Input id="storefront-url" {...form.register("storefrontUrl")} />
          <p className="text-sm text-destructive">
            {form.formState.errors.storefrontUrl?.message}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="default-destination-url">Destinazione Shopify predefinita</Label>
          <Input id="default-destination-url" {...form.register("defaultDestinationUrl")} />
          <p className="text-sm text-destructive">
            {form.formState.errors.defaultDestinationUrl?.message}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Stato installazione</Label>
            <Select
              defaultValue={form.getValues("installState")}
              onValueChange={(value) =>
                form.setValue("installState", value as StoreConnectionValues["installState"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona stato installazione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="installed">Installata</SelectItem>
                <SelectItem value="installing">In installazione</SelectItem>
                <SelectItem value="reauth_required">Richiede nuova autorizzazione</SelectItem>
                <SelectItem value="not_installed">Non installata</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stato connessione</Label>
            <Select
              defaultValue={form.getValues("status")}
              onValueChange={(value) =>
                form.setValue("status", value as StoreConnectionValues["status"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona stato connessione" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="connected">Connessa</SelectItem>
              <SelectItem value="attention_required">Richiede attenzione</SelectItem>
              <SelectItem value="not_connected">Non connessa</SelectItem>
            </SelectContent>
          </Select>
          </div>
            <p className="text-sm text-muted-foreground">
          {installState === "installed" && status === "connected"
            ? "L'app Shopify e installata correttamente e il workspace merchant puo lavorare su dati store affidabili."
              : installState === "reauth_required"
                ? "Usa questo stato quando OAuth va rinnovato prima di riprendere sync e webhook."
                : status === "attention_required"
                  ? "Usa questo stato quando installazione, scope o tracking richiedono ancora una revisione operativa."
                  : "Usa questi stati quando installazione, permessi o connessione store non sono ancora completi."}
          </p>
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
            description="Mantiene allineata la governance dei codici promo con la disponibilita dei flussi Shopify dedicati."
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
            description="Prepara il workspace merchant a generare coupon a partire da approvazioni e richieste affiliate."
          />
          <SettingToggleCard
            checked={Boolean(appEmbedEnabled)}
            onChange={(checked) =>
              form.setValue("appEmbedEnabled", checked, { shouldValidate: true })
            }
            label="Theme app embed"
            description="Segna come configurati tracking storefront e requisiti del theme app embed Shopify."
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Scope Shopify concessi</Label>
          <p className="text-sm text-muted-foreground">
            Questi permessi determinano se sync e webhook possono davvero funzionare.
          </p>
        </div>
        <div className="grid gap-2.5">
          {SHOPIFY_SCOPE_OPTIONS.map((scope) => {
            const granted = grantedScopes.includes(scope.value);

            return (
              <label key={scope.value} className="ui-panel-block flex items-start gap-3">
                <Checkbox
                  checked={granted}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? Array.from(new Set([...grantedScopes, scope.value]))
                      : grantedScopes.filter((value) => value !== scope.value);

                    form.setValue("grantedScopes", next, { shouldValidate: true });
                  }}
                />
                <span>
                  <span className="block text-sm font-medium">{scope.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {scope.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Salva configurazione store"}
        </Button>
      </div>
    </form>
  );
}

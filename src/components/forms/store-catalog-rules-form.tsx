"use client";

import { useEffect, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateStoreCatalogRulesAction } from "@/app/actions/admin";
import type { StoreCatalogItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { storeCatalogRulesSchema } from "@/lib/validations";

type StoreCatalogRulesValues = z.input<typeof storeCatalogRulesSchema>;

interface StoreCatalogRulesFormProps {
  items: StoreCatalogItem[];
  defaultDestinationUrl: string;
}

export function StoreCatalogRulesForm({
  items,
  defaultDestinationUrl,
}: StoreCatalogRulesFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<StoreCatalogRulesValues>({
    resolver: zodResolver(storeCatalogRulesSchema),
    defaultValues: {
      defaultDestinationUrl,
      enabledDestinationUrls: items
        .filter((item) => item.isAffiliateEnabled)
        .map((item) => item.destinationUrl),
    },
  });
  const enabledDestinationUrls = useWatch({
    control: form.control,
    name: "enabledDestinationUrls",
    defaultValue: form.getValues("enabledDestinationUrls"),
  });
  const selectedDefaultDestinationUrl = useWatch({
    control: form.control,
    name: "defaultDestinationUrl",
  });

  useEffect(() => {
    const currentDefault = form.getValues("defaultDestinationUrl");

    if (!enabledDestinationUrls.includes(currentDefault)) {
      form.setValue("defaultDestinationUrl", enabledDestinationUrls[0] ?? "", {
        shouldValidate: true,
      });
    }
  }, [enabledDestinationUrls, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateStoreCatalogRulesAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Destinazione affiliate predefinita</Label>
        <Select
          value={selectedDefaultDestinationUrl || undefined}
          onValueChange={(value) =>
            form.setValue("defaultDestinationUrl", value, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Scegli la destinazione Shopify predefinita" />
          </SelectTrigger>
          <SelectContent>
            {items
              .filter((item) => enabledDestinationUrls.includes(item.destinationUrl))
              .map((item) => (
                <SelectItem key={item.id} value={item.destinationUrl}>
                  {item.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ui-panel-block">
        <div className="ui-surface-overline">
          Destinazioni Shopify abilitate per gli affiliati
        </div>
        <div className="mt-4 grid gap-3">
          {items.map((item) => {
            const enabled = enabledDestinationUrls.includes(item.destinationUrl);

            return (
              <label key={item.id} className="ui-panel-block flex items-start gap-3">
                <Checkbox
                  checked={enabled}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? Array.from(new Set([...enabledDestinationUrls, item.destinationUrl]))
                      : enabledDestinationUrls.filter(
                          (destinationUrl) => destinationUrl !== item.destinationUrl,
                        );
                    form.setValue("enabledDestinationUrls", next, { shouldValidate: true });
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    <Badge variant="outline">{item.type}</Badge>
                    {item.isFeatured ? <Badge variant="secondary">in evidenza</Badge> : null}
                  </div>
                  <div className="ui-wrap-anywhere mt-1 text-sm text-muted-foreground">
                    {item.destinationUrl}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Salva regole destinazione"}
        </Button>
      </div>
    </form>
  );
}

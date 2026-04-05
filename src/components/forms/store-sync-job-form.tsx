"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { triggerStoreSyncAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { storeSyncJobSchema } from "@/lib/validations";

type StoreSyncJobValues = z.input<typeof storeSyncJobSchema>;

export function StoreSyncJobForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<StoreSyncJobValues>({
    resolver: zodResolver(storeSyncJobSchema),
    defaultValues: {
      type: "products",
      mode: "incremental",
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await triggerStoreSyncAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        type: values.type,
        mode: values.mode,
        notes: "",
      });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Flusso sync</Label>
          <Select
            defaultValue={form.getValues("type")}
            onValueChange={(value) =>
              form.setValue("type", value as StoreSyncJobValues["type"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Scegli il flusso da sincronizzare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="products">Prodotti</SelectItem>
              <SelectItem value="collections">Collection</SelectItem>
              <SelectItem value="pages">Pagine</SelectItem>
              <SelectItem value="discounts">Codici sconto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Modalita</Label>
          <Select
            defaultValue={form.getValues("mode")}
            onValueChange={(value) =>
              form.setValue("mode", value as StoreSyncJobValues["mode"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Scegli la modalita di sync" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incremental">Incrementale</SelectItem>
              <SelectItem value="full">Completa</SelectItem>
              <SelectItem value="retry">Riprova elementi falliti</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sync-notes">Nota esecuzione</Label>
        <Textarea
          id="sync-notes"
          rows={3}
          placeholder="Nota operativa facoltativa per tracciare l'esecuzione"
          {...form.register("notes")}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Avvio..." : "Avvia sincronizzazione Shopify"}
        </Button>
      </div>
    </form>
  );
}

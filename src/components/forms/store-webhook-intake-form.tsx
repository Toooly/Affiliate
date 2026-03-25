"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ingestStoreWebhookAction } from "@/app/actions/admin";
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
import { storeWebhookIngestionSchema } from "@/lib/validations";

type StoreWebhookValues = z.input<typeof storeWebhookIngestionSchema>;

export function StoreWebhookIntakeForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<StoreWebhookValues>({
    resolver: zodResolver(storeWebhookIngestionSchema),
    defaultValues: {
      topic: "orders/paid",
      orderId: "",
      orderAmount: 0,
      currency: "USD",
      customerEmail: "",
      referralCode: "",
      discountCode: "",
    },
  });
  const topic = useWatch({
    control: form.control,
    name: "topic",
    defaultValue: form.getValues("topic"),
  });
  const needsOrderAmount = topic !== "discounts/update" && topic !== "app/uninstalled";

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await ingestStoreWebhookAction({
        ...values,
        orderAmount: needsOrderAmount ? values.orderAmount : null,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        topic: values.topic,
        orderId: "",
        orderAmount: 0,
        currency: values.currency,
        customerEmail: "",
        referralCode: "",
        discountCode: "",
      });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Topic webhook</Label>
          <Select
            defaultValue={form.getValues("topic")}
            onValueChange={(value) =>
              form.setValue("topic", value as StoreWebhookValues["topic"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Scegli l'evento Shopify" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orders/create">orders/create</SelectItem>
              <SelectItem value="orders/paid">orders/paid</SelectItem>
              <SelectItem value="discounts/update">discounts/update</SelectItem>
              <SelectItem value="app/uninstalled">app/uninstalled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="webhook-order-id">ID ordine esterno</Label>
          <Input id="webhook-order-id" {...form.register("orderId")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="webhook-referral-code">Codice referral</Label>
          <Input
            id="webhook-referral-code"
            placeholder="Facoltativo: codice link da /r/:code"
            {...form.register("referralCode")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webhook-discount-code">Codice sconto</Label>
          <Input
            id="webhook-discount-code"
            placeholder="Facoltativo: codice sconto Shopify"
            {...form.register("discountCode")}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="webhook-order-amount">Importo ordine</Label>
          <Input
            id="webhook-order-amount"
            type="number"
            step="0.01"
            disabled={!needsOrderAmount}
            {...form.register("orderAmount")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webhook-currency">Valuta</Label>
          <Input
            id="webhook-currency"
            maxLength={3}
            {...form.register("currency")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="webhook-customer-email">Email cliente</Label>
          <Input id="webhook-customer-email" {...form.register("customerEmail")} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Elaborazione..." : "Acquisisci evento store"}
        </Button>
      </div>
    </form>
  );
}

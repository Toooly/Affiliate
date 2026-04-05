"use client";

import { useEffect, useMemo, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createPayoutBatchAction } from "@/app/actions/admin";
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
import type { ConversionListItem, PayoutMethod } from "@/lib/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { payoutBatchSchema } from "@/lib/validations";

type PayoutBatchValues = z.input<typeof payoutBatchSchema>;

interface PayoutBatchFormProps {
  influencers: Array<{
    id: string;
    fullName: string;
    payoutMethod: PayoutMethod | null;
  }>;
  conversions: ConversionListItem[];
  defaultInfluencerId?: string;
  hideInfluencerField?: boolean;
}

export function PayoutBatchForm({
  influencers,
  conversions,
  defaultInfluencerId,
  hideInfluencerField = false,
}: PayoutBatchFormProps) {
  const [isPending, startTransition] = useTransition();
  const initialInfluencerId = defaultInfluencerId ?? influencers[0]?.id ?? "";
  const form = useForm<PayoutBatchValues>({
    resolver: zodResolver(payoutBatchSchema),
    defaultValues: {
      influencerId: initialInfluencerId,
      conversionIds: [],
      method:
        influencers.find((influencer) => influencer.id === initialInfluencerId)?.payoutMethod ??
        "manual",
      status: "pending",
      reference: "",
    },
  });
  const influencerId = useWatch({
    control: form.control,
    name: "influencerId",
  });
  const method = useWatch({
    control: form.control,
    name: "method",
  });
  const status = useWatch({
    control: form.control,
    name: "status",
  });
  const selectedConversionIds =
    useWatch({
      control: form.control,
      name: "conversionIds",
    }) ?? [];
  const selectedInfluencer = influencers.find((influencer) => influencer.id === influencerId);
  const visibleConversions = useMemo(
    () =>
      conversions.filter((conversion) =>
        influencerId ? conversion.influencerId === influencerId : true,
      ),
    [conversions, influencerId],
  );
  const selectedTotal = visibleConversions
    .filter((conversion) => selectedConversionIds.includes(conversion.id))
    .reduce((sum, conversion) => sum + conversion.commissionAmount, 0);

  useEffect(() => {
    form.setValue("conversionIds", [], { shouldValidate: true });
    form.setValue("method", selectedInfluencer?.payoutMethod ?? "manual");
  }, [form, selectedInfluencer?.id, selectedInfluencer?.payoutMethod]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPayoutBatchAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        influencerId: values.influencerId,
        conversionIds: [],
        method: values.method,
        status: "pending",
        reference: "",
      });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {!hideInfluencerField ? (
          <div className="space-y-2">
            <Label>Affiliato</Label>
            <Select value={influencerId} onValueChange={(value) => form.setValue("influencerId", value)}>
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
          <Label>Metodo di pagamento</Label>
          <Select
            value={method}
            onValueChange={(value) => form.setValue("method", value as PayoutBatchValues["method"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="bank_transfer">Bonifico bancario</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="manual">Manuale</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Stato</Label>
          <Select
            value={status}
            onValueChange={(value) => form.setValue("status", value as PayoutBatchValues["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Bozza</SelectItem>
              <SelectItem value="pending">In attesa</SelectItem>
              <SelectItem value="processing">In elaborazione</SelectItem>
              <SelectItem value="paid">Pagato</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payout-reference">Riferimento</Label>
          <Input
            id="payout-reference"
            placeholder="Riferimento pagamento facoltativo"
            {...form.register("reference")}
          />
        </div>
      </div>

      <div className="ui-panel-block">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="ui-surface-overline">
              Commissioni approvate pronte per il payout
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Seleziona le conversioni approvate da includere in questo batch di pagamento.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                form.setValue(
                  "conversionIds",
                  visibleConversions.map((conversion) => conversion.id),
                  { shouldValidate: true },
                )
              }
              disabled={!visibleConversions.length}
            >
              Seleziona tutto
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => form.setValue("conversionIds", [], { shouldValidate: true })}
              disabled={!selectedConversionIds.length}
            >
              Azzera
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {visibleConversions.length ? (
            visibleConversions.map((conversion) => {
              const selected = selectedConversionIds.includes(conversion.id);

              return (
                <label key={conversion.id} className="ui-panel-block flex items-start gap-3">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? Array.from(new Set([...selectedConversionIds, conversion.id]))
                        : selectedConversionIds.filter((id) => id !== conversion.id);
                      form.setValue("conversionIds", next, { shouldValidate: true });
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-medium">{conversion.orderId}</div>
                      <div className="text-sm font-medium">
                        {formatCurrency(conversion.commissionAmount, conversion.currency)}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {conversion.campaignName ?? "Nessuna campagna"} &middot;{" "}
                      {formatCurrency(conversion.orderAmount, conversion.currency)} di ordine{" "}
                      &middot; {formatShortDate(conversion.createdAt)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {conversion.referralCode ? `/${conversion.referralCode}` : "Nessun link"}{" "}
                      &middot;{" "}
                      {conversion.promoCode ? `Codice ${conversion.promoCode}` : "Nessun codice"}
                    </div>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="ui-panel-block border-dashed text-sm text-muted-foreground">
              Al momento non ci sono commissioni approvate e non allocate per questo affiliato.
            </div>
          )}
        </div>
      </div>

      <div className="ui-panel-block flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="ui-surface-overline">
            Riepilogo batch
          </div>
          <div className="ui-card-title mt-2">
            {selectedConversionIds.length} conversioni &middot; {formatCurrency(selectedTotal)}
          </div>
        </div>
        <Button type="submit" disabled={isPending || !selectedConversionIds.length}>
          {isPending ? "Creazione batch..." : "Crea batch payout"}
        </Button>
      </div>
    </form>
  );
}

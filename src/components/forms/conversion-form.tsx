"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createConversionAction } from "@/app/actions/admin";
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
import type {
  ConversionInput,
  InfluencerListItem,
  PromoCodeListItem,
  ReferralLinkListItem,
} from "@/lib/types";
import { conversionSchema } from "@/lib/validations";

type ConversionFormValues = z.input<typeof conversionSchema>;

interface ConversionFormProps {
  influencers: InfluencerListItem[];
  referralLinks: ReferralLinkListItem[];
  promoCodes: PromoCodeListItem[];
  defaultInfluencerId?: string;
  hideInfluencerField?: boolean;
}

export function ConversionForm({
  influencers,
  referralLinks,
  promoCodes,
  defaultInfluencerId,
  hideInfluencerField = false,
}: ConversionFormProps) {
  const initialInfluencer =
    influencers.find((item) => item.id === defaultInfluencerId) ?? influencers[0];
  const [isPending, startTransition] = useTransition();
  const form = useForm<ConversionFormValues, unknown, ConversionInput>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      influencerId: initialInfluencer?.id ?? "",
      referralLinkId: initialInfluencer?.primaryReferralLink?.id ?? null,
      promoCodeId: null,
      orderId: "",
      customerEmail: "",
      orderAmount: 120,
      currency: "USD",
      commissionType: initialInfluencer?.commissionType ?? "percentage",
      commissionValue: initialInfluencer?.commissionValue ?? 10,
      attributionSource: "link",
      status: "approved",
    },
  });
  const influencerId = useWatch({
    control: form.control,
    name: "influencerId",
  });
  const referralLinkId = useWatch({
    control: form.control,
    name: "referralLinkId",
  });
  const promoCodeId = useWatch({
    control: form.control,
    name: "promoCodeId",
  });
  const attributionSource = useWatch({
    control: form.control,
    name: "attributionSource",
  });
  const status = useWatch({
    control: form.control,
    name: "status",
  });
  const currency = useWatch({
    control: form.control,
    name: "currency",
  });
  const commissionType = useWatch({
    control: form.control,
    name: "commissionType",
  });
  const filteredLinks = referralLinks.filter((link) => link.influencerId === influencerId);
  const filteredCodes = promoCodes.filter(
    (promoCode) =>
      promoCode.influencerId === influencerId && promoCode.status === "active",
  );

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createConversionAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        ...form.getValues(),
        orderId: "",
        customerEmail: "",
        orderAmount: 120,
      });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="ui-panel-block">
        <div className="ui-surface-overline">
          Attribuzione ordine
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {!hideInfluencerField ? (
            <div className="space-y-2">
              <Label>Affiliato</Label>
              <Select
                value={influencerId}
                onValueChange={(value) => {
                  const selected = influencers.find((item) => item.id === value);
                  form.setValue("influencerId", value);
                  form.setValue("referralLinkId", selected?.primaryReferralLink?.id ?? null);
                  form.setValue("promoCodeId", null);
                  form.setValue("commissionType", selected?.commissionType ?? "percentage");
                  form.setValue("commissionValue", selected?.commissionValue ?? 10);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona affiliato" />
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
            <Label>Referral link</Label>
            <Select
              value={referralLinkId ?? "none"}
              onValueChange={(value) =>
                form.setValue("referralLinkId", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Facoltativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nessun link</SelectItem>
                {filteredLinks.map((link) => (
                  <SelectItem key={link.id} value={link.id}>
                    {link.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Codice promo</Label>
            <Select
              value={promoCodeId ?? "none"}
              onValueChange={(value) =>
                form.setValue("promoCodeId", value === "none" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Facoltativo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nessun codice</SelectItem>
                {filteredCodes.map((promoCode) => (
                  <SelectItem key={promoCode.id} value={promoCode.id}>
                    {promoCode.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Origine attribuzione</Label>
            <Select
              value={attributionSource}
              onValueChange={(value) =>
                form.setValue(
                  "attributionSource",
                  value as ConversionInput["attributionSource"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="promo_code">Codice promo</SelectItem>
                <SelectItem value="hybrid">Ibrida</SelectItem>
                <SelectItem value="manual">Manuale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-id">ID ordine</Label>
            <Input id="order-id" {...form.register("orderId")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email cliente</Label>
            <Input id="customer-email" type="email" {...form.register("customerEmail")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-amount">Importo ordine</Label>
            <Input
              id="order-amount"
              type="number"
              step="0.01"
              {...form.register("orderAmount", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label>Stato</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                form.setValue("status", value as ConversionInput["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="approved">Approvata</SelectItem>
                <SelectItem value="paid">Pagata</SelectItem>
                <SelectItem value="cancelled">Annullata</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="ui-panel-block">
        <div className="ui-surface-overline">
          Regole commissione
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Valuta</Label>
            <Select
              value={currency}
              onValueChange={(value) =>
                form.setValue("currency", value as ConversionInput["currency"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo commissione</Label>
            <Select
              value={commissionType}
              onValueChange={(value) =>
                form.setValue("commissionType", value as ConversionInput["commissionType"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentuale</SelectItem>
                <SelectItem value="fixed">Fissa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission-value">Valore commissione</Label>
            <Input
              id="commission-value"
              type="number"
              step="0.01"
              {...form.register("commissionValue", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? "Registrazione..." : "Registra conversione"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateInfluencerAdminAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type { AdminInfluencerInput, InfluencerListItem } from "@/lib/types";
import { adminInfluencerSchema } from "@/lib/validations";

type AdminInfluencerFormValues = z.input<typeof adminInfluencerSchema>;

interface InfluencerAdminFormProps {
  influencer: InfluencerListItem;
}

export function InfluencerAdminForm({
  influencer,
}: InfluencerAdminFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<
    AdminInfluencerFormValues,
    unknown,
    AdminInfluencerInput
  >({
    resolver: zodResolver(adminInfluencerSchema),
    defaultValues: {
      fullName: influencer.fullName,
      email: influencer.email,
      country: influencer.country ?? "",
      isActive: influencer.isActive,
      commissionType: influencer.commissionType,
      commissionValue: influencer.commissionValue,
      payoutMethod: influencer.payoutMethod ?? "paypal",
      payoutEmail: influencer.payoutEmail ?? influencer.email,
      notes: influencer.notes ?? "",
    },
  });
  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateInfluencerAdminAction(influencer.id, values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Gestisci
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Modifica affiliato</DialogTitle>
          <DialogDescription>
            Aggiorna commissioni, preferenze di pagamento, note operative e accesso all&apos;account senza uscire dal flusso admin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`name-${influencer.id}`}>Nome completo</Label>
            <Input id={`name-${influencer.id}`} {...form.register("fullName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`email-${influencer.id}`}>Email</Label>
            <Input id={`email-${influencer.id}`} type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`country-${influencer.id}`}>Paese</Label>
            <Input id={`country-${influencer.id}`} {...form.register("country")} />
          </div>
          <div className="space-y-2">
            <Label>Tipo commissione</Label>
            <Select
              defaultValue={form.getValues("commissionType")}
              onValueChange={(value) =>
                form.setValue(
                  "commissionType",
                  value as AdminInfluencerInput["commissionType"],
                )
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
            <Label htmlFor={`commission-${influencer.id}`}>Valore commissione</Label>
            <Input
              id={`commission-${influencer.id}`}
              type="number"
              step="0.01"
              {...form.register("commissionValue", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label>Metodo di pagamento</Label>
            <Select
              defaultValue={form.getValues("payoutMethod")}
              onValueChange={(value) =>
                form.setValue(
                  "payoutMethod",
                  value as AdminInfluencerInput["payoutMethod"],
                )
              }
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`payout-email-${influencer.id}`}>Email per i pagamenti</Label>
            <Input
              id={`payout-email-${influencer.id}`}
              type="email"
              {...form.register("payoutEmail")}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`notes-${influencer.id}`}>Note interne</Label>
            <Textarea id={`notes-${influencer.id}`} {...form.register("notes")} />
          </div>
          <label className="ui-field-toggle md:col-span-2 rounded-3xl">
            <Checkbox
              checked={isActive}
              onCheckedChange={(checked) =>
                form.setValue("isActive", Boolean(checked), { shouldValidate: true })
              }
            />
            <span className="text-sm text-muted-foreground">
              L&apos;affiliato e attivo e puo accedere al proprio portale.
            </span>
          </label>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : "Salva modifiche"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { updateInfluencerSettingsAction } from "@/app/actions/influencer";
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
import type { InfluencerSettingsData, InfluencerSettingsInput } from "@/lib/types";
import { influencerSettingsSchema } from "@/lib/validations";

interface InfluencerSettingsFormProps {
  initialData: InfluencerSettingsData;
}

export function InfluencerSettingsForm({
  initialData,
}: InfluencerSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<InfluencerSettingsInput>({
    resolver: zodResolver(influencerSettingsSchema),
    defaultValues: {
      fullName: initialData.profile.fullName,
      country: initialData.profile.country ?? "",
      instagramHandle: initialData.application?.instagramHandle ?? "",
      tiktokHandle: initialData.application?.tiktokHandle ?? "",
      youtubeHandle: initialData.application?.youtubeHandle ?? "",
      payoutMethod: initialData.influencer.payoutMethod ?? "paypal",
      payoutEmail: initialData.influencer.payoutEmail ?? initialData.profile.email,
      companyName: initialData.influencer.companyName ?? "",
      taxId: initialData.influencer.taxId ?? "",
      notificationEmail:
        initialData.influencer.notificationEmail ??
        initialData.influencer.payoutEmail ??
        initialData.profile.email,
      notificationsEnabled: initialData.influencer.notificationsEnabled,
    },
  });
  const notificationsEnabled = useWatch({
    control: form.control,
    name: "notificationsEnabled",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateInfluencerSettingsAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset(values);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="ui-panel-block ui-panel-block-strong">
        <div className="ui-surface-overline">
          Profilo
        </div>
        <div className="mt-3.5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome e cognome</Label>
            <Input id="fullName" {...form.register("fullName")} />
            <p className="text-sm text-destructive">{form.formState.errors.fullName?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Paese</Label>
            <Input id="country" {...form.register("country")} />
            <p className="text-sm text-destructive">{form.formState.errors.country?.message}</p>
          </div>
        </div>
      </div>

      <div className="ui-panel-block">
        <div className="ui-surface-overline">
          Handle social
        </div>
        <div className="mt-3.5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="instagramHandle">Handle Instagram</Label>
            <Input id="instagramHandle" {...form.register("instagramHandle")} />
            <p className="text-sm text-destructive">{form.formState.errors.instagramHandle?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktokHandle">Handle TikTok</Label>
            <Input id="tiktokHandle" {...form.register("tiktokHandle")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="youtubeHandle">Handle YouTube</Label>
            <Input id="youtubeHandle" {...form.register("youtubeHandle")} />
          </div>
        </div>
      </div>

      <div className="ui-panel-block">
        <div className="ui-surface-overline">
          Preferenze payout
        </div>
        <div className="mt-3.5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Metodo payout</Label>
            <Select
              defaultValue={form.getValues("payoutMethod")}
              onValueChange={(value) =>
                form.setValue("payoutMethod", value as InfluencerSettingsInput["payoutMethod"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">Bonifico</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="manual">Manuale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payoutEmail">Email payout</Label>
            <Input id="payoutEmail" type="email" {...form.register("payoutEmail")} />
            <p className="text-sm text-destructive">{form.formState.errors.payoutEmail?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Ragione sociale o entita legale</Label>
            <Input id="companyName" {...form.register("companyName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">Partita IVA o codice fiscale</Label>
            <Input id="taxId" {...form.register("taxId")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notificationEmail">Email notifiche</Label>
            <Input id="notificationEmail" type="email" {...form.register("notificationEmail")} />
            <p className="text-sm text-destructive">
              {form.formState.errors.notificationEmail?.message}
            </p>
          </div>
        </div>
      </div>

      <label className="ui-panel-block flex items-center gap-3">
        <input
          type="checkbox"
          className="size-4 rounded border border-border"
          checked={notificationsEnabled}
          onChange={(event) =>
            form.setValue("notificationsEnabled", event.target.checked, {
              shouldValidate: true,
            })
          }
        />
        <span className="text-sm text-muted-foreground">
          Ricevi aggiornamenti sul programma e notifiche payout via email.
        </span>
      </label>

      <div className="ui-panel-block flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Questi dati aiutano il team admin a verificare il profilo e a preparare i payout senza rallentamenti.
        </p>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Salva impostazioni"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createAffiliateInviteAction } from "@/app/actions/admin";
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
import { Textarea } from "@/components/ui/textarea";
import { affiliateInviteSchema } from "@/lib/validations";

type AffiliateInviteValues = z.input<typeof affiliateInviteSchema>;

interface AffiliateInviteFormProps {
  campaigns: Array<{ id: string; name: string }>;
}

export function AffiliateInviteForm({ campaigns }: AffiliateInviteFormProps) {
  const [isPending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const form = useForm<AffiliateInviteValues>({
    resolver: zodResolver(affiliateInviteSchema),
    defaultValues: {
      invitedName: "",
      invitedEmail: "",
      note: "",
      campaignId: null,
      expiresInDays: 14,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createAffiliateInviteAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setInviteUrl(result.data ?? null);
      toast.success(result.message);
      form.reset({
        invitedName: "",
        invitedEmail: "",
        note: "",
        campaignId: null,
        expiresInDays: 14,
      });
    });
  });

  const copyInviteUrl = async () => {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Link invito copiato.");
    } catch {
      toast.error("Non siamo riusciti a copiare il link invito.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-name">Nome partner</Label>
          <Input
            id="invite-name"
            placeholder="Giulia Moretti"
            {...form.register("invitedName")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email partner</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="creator@studio.com"
            {...form.register("invitedEmail")}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Campagna iniziale</Label>
          <Select
            defaultValue={form.getValues("campaignId") ?? "none"}
            onValueChange={(value) =>
              form.setValue("campaignId", value === "none" ? null : value, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Nessuna campagna iniziale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessuna campagna</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-expiration">Validita link (giorni)</Label>
          <Input
            id="invite-expiration"
            type="number"
            min={1}
            max={90}
            {...form.register("expiresInDays", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-note">Nota operativa</Label>
        <Textarea
          id="invite-note"
          placeholder="Note interne o contesto da collegare a questo onboarding partner."
          {...form.register("note")}
        />
      </div>

      {inviteUrl ? (
        <div className="ui-panel-block space-y-3">
          <div className="text-sm font-medium">Link registrazione pronto</div>
          <Input value={inviteUrl} readOnly />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={copyInviteUrl}>
              Copia link
            </Button>
            <Button type="button" variant="ghost" onClick={() => setInviteUrl(null)}>
              Chiudi
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Generazione..." : "Genera link invito"}
        </Button>
      </div>
    </form>
  );
}

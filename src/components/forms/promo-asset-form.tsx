"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { upsertPromoAssetAction } from "@/app/actions/admin";
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
import type { PromoAsset, PromoAssetInput } from "@/lib/types";
import { promoAssetSchema } from "@/lib/validations";

interface PromoAssetFormProps {
  asset?: PromoAsset;
  campaigns?: Array<{ id: string; name: string }>;
  defaultCampaignId?: string | null;
  hideCampaignField?: boolean;
  triggerLabel?: string;
}

export function PromoAssetForm({
  asset,
  campaigns = [],
  defaultCampaignId = null,
  hideCampaignField = false,
  triggerLabel,
}: PromoAssetFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PromoAssetInput>({
    resolver: zodResolver(promoAssetSchema),
    defaultValues: {
      id: asset?.id,
      title: asset?.title ?? "",
      type: asset?.type ?? "image",
      fileUrl: asset?.fileUrl ?? "",
      description: asset?.description ?? "",
      caption: asset?.caption ?? "",
      instructions: asset?.instructions ?? "",
      campaignId: asset?.campaignId ?? defaultCampaignId,
      isActive: asset?.isActive ?? true,
    },
  });
  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertPromoAssetAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
      if (!asset) {
        form.reset({
          title: "",
          type: "image",
          fileUrl: "",
          description: "",
          caption: "",
          instructions: "",
          campaignId: defaultCampaignId,
          isActive: true,
        });
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={asset ? "outline" : "default"} size="sm">
          {triggerLabel ?? (asset ? "Modifica" : "Nuovo asset")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{asset ? "Modifica asset promozionale" : "Crea asset promozionale"}</DialogTitle>
          <DialogDescription>
            Registra un asset condivisibile con URL, campagna collegata e metadati utili per gli affiliati nel loro portale.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`asset-title-${asset?.id ?? "new"}`}>Titolo</Label>
              <Input id={`asset-title-${asset?.id ?? "new"}`} {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                defaultValue={form.getValues("type")}
                onValueChange={(value) =>
                  form.setValue("type", value as PromoAssetInput["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Immagine</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="copy">Copy</SelectItem>
                  <SelectItem value="brand_guide">Linee guida brand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`asset-url-${asset?.id ?? "new"}`}>URL file</Label>
              <Input id={`asset-url-${asset?.id ?? "new"}`} {...form.register("fileUrl")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`asset-desc-${asset?.id ?? "new"}`}>Descrizione</Label>
              <Textarea id={`asset-desc-${asset?.id ?? "new"}`} {...form.register("description")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`asset-caption-${asset?.id ?? "new"}`}>Caption suggerita</Label>
              <Textarea
                id={`asset-caption-${asset?.id ?? "new"}`}
                placeholder="Facoltativa: caption pronta all'uso o punti chiave da raccontare."
                {...form.register("caption")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`asset-instructions-${asset?.id ?? "new"}`}>Istruzioni operative</Label>
              <Textarea
                id={`asset-instructions-${asset?.id ?? "new"}`}
                placeholder="Note d'uso, indicazioni di placement, cose da fare o da evitare."
                {...form.register("instructions")}
              />
            </div>
            {!hideCampaignField ? (
              <div className="space-y-2">
                <Label>Campagna</Label>
                <Select
                  defaultValue={form.getValues("campaignId") ?? "none"}
                  onValueChange={(value) =>
                    form.setValue("campaignId", value === "none" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Campagna facoltativa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Libreria generale</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <label className="ui-field-toggle rounded-[24px]">
            <Checkbox
              checked={isActive}
              onCheckedChange={(checked) =>
                form.setValue("isActive", Boolean(checked), { shouldValidate: true })
              }
            />
            <span className="text-sm text-muted-foreground">
              L&apos;asset è visibile nelle dashboard affiliate.
            </span>
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : "Salva asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

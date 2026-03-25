"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createManualSuspiciousEventAction } from "@/app/actions/admin";
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
import { manualSuspiciousEventSchema } from "@/lib/validations";

type ManualSuspiciousEventValues = z.input<typeof manualSuspiciousEventSchema>;

interface ManualSuspiciousEventFormProps {
  influencerId: string;
}

export function ManualSuspiciousEventForm({
  influencerId,
}: ManualSuspiciousEventFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ManualSuspiciousEventValues>({
    resolver: zodResolver(manualSuspiciousEventSchema),
    defaultValues: {
      influencerId,
      title: "",
      detail: "",
      severity: "medium",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createManualSuspiciousEventAction(values);

      if (result.ok) {
        toast.success(result.message);
        form.reset({ ...values, title: "", detail: "" });
        return;
      }

      toast.error(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <div className="space-y-2">
          <Label htmlFor={`manual-flag-title-${influencerId}`}>Titolo</Label>
          <Input
            id={`manual-flag-title-${influencerId}`}
            placeholder="Es. controllo anomalia coupon"
            {...form.register("title")}
          />
        </div>
        <div className="space-y-2">
          <Label>Severità</Label>
          <Select
            defaultValue={form.getValues("severity")}
            onValueChange={(value) =>
              form.setValue("severity", value as ManualSuspiciousEventValues["severity"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Bassa</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`manual-flag-detail-${influencerId}`}>Dettaglio</Label>
        <Textarea
          id={`manual-flag-detail-${influencerId}`}
          placeholder="Descrivi il motivo del controllo manuale."
          {...form.register("detail")}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio..." : "Aggiungi flag manuale"}
        </Button>
      </div>
    </form>
  );
}

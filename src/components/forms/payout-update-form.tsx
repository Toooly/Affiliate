"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updatePayoutAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PayoutListItem, PayoutUpdateInput } from "@/lib/types";
import { payoutUpdateSchema } from "@/lib/validations";

interface PayoutUpdateFormProps {
  payout: PayoutListItem;
}

export function PayoutUpdateForm({ payout }: PayoutUpdateFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<PayoutUpdateInput>({
    resolver: zodResolver(payoutUpdateSchema),
    defaultValues: {
      payoutId: payout.id,
      status: payout.status,
      reference: payout.reference ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updatePayoutAction(values);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        defaultValue={form.getValues("status")}
        onValueChange={(value) =>
          form.setValue("status", value as PayoutUpdateInput["status"])
        }
      >
        <SelectTrigger className="min-w-[148px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Bozza</SelectItem>
          <SelectItem value="pending">In attesa</SelectItem>
          <SelectItem value="processing">In elaborazione</SelectItem>
          <SelectItem value="paid">Pagato</SelectItem>
          <SelectItem value="failed">Fallito</SelectItem>
        </SelectContent>
      </Select>
      <Input className="sm:min-w-[180px]" placeholder="Riferimento" {...form.register("reference")} />
      <Button type="submit" size="sm" disabled={isPending}>
        Salva
      </Button>
    </form>
  );
}

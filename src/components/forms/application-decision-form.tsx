"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  approveApplicationAction,
  rejectApplicationAction,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
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
import type { ApplicationListItem } from "@/lib/types";
import {
  applicationApprovalSchema,
  applicationRejectionSchema,
} from "@/lib/validations";

type ApprovalValues = z.input<typeof applicationApprovalSchema>;
type RejectionValues = z.input<typeof applicationRejectionSchema>;

interface ApplicationDecisionFormProps {
  application: ApplicationListItem;
  mode: "approve" | "reject";
  campaigns?: Array<{ id: string; name: string }>;
}

export function ApplicationDecisionForm({
  application,
  mode,
  campaigns = [],
}: ApplicationDecisionFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const approvalForm = useForm<ApprovalValues>({
    resolver: zodResolver(applicationApprovalSchema),
    defaultValues: {
      reviewNotes: application.reviewNotes ?? "",
      commissionType: "percentage",
      commissionValue: 15,
      payoutMethod: "paypal",
      campaignId: null,
    },
  });
  const rejectionForm = useForm<RejectionValues>({
    resolver: zodResolver(applicationRejectionSchema),
    defaultValues: {
      reviewNotes: application.reviewNotes ?? "",
    },
  });

  const handleApprove = approvalForm.handleSubmit((values) => {
    startTransition(async () => {
      const result = await approveApplicationAction(application.id, values);

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  });

  const handleReject = rejectionForm.handleSubmit((values) => {
    startTransition(async () => {
      const result = await rejectApplicationAction(application.id, values);

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "approve" ? "default" : "outline"} size="sm" className="w-full">
          {mode === "approve" ? "Approva affiliato" : "Rifiuta candidatura"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "approve" ? "Approva candidatura" : "Rifiuta candidatura"}
          </DialogTitle>
          <DialogDescription>
            {mode === "approve"
              ? "Imposta i parametri iniziali dell'affiliato prima di attivarlo."
              : "Aggiungi una nota interna prima di chiudere la candidatura."}
          </DialogDescription>
        </DialogHeader>

        {mode === "approve" ? (
          <form onSubmit={handleApprove} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Commissione iniziale</Label>
                <Select
                  defaultValue={approvalForm.getValues("commissionType")}
                  onValueChange={(value) =>
                    approvalForm.setValue(
                      "commissionType",
                      value as ApprovalValues["commissionType"],
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
                <Label htmlFor={`approval-commission-${application.id}`}>Valore</Label>
                <Input
                  id={`approval-commission-${application.id}`}
                  type="number"
                  step="0.01"
                  {...approvalForm.register("commissionValue", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Metodo payout iniziale</Label>
                <Select
                  defaultValue={approvalForm.getValues("payoutMethod")}
                  onValueChange={(value) =>
                    approvalForm.setValue(
                      "payoutMethod",
                      value as ApprovalValues["payoutMethod"],
                    )
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
              <div className="space-y-2 md:col-span-2">
                <Label>Campagna iniziale</Label>
                <Select
                  defaultValue={approvalForm.getValues("campaignId") ?? "none"}
                  onValueChange={(value) =>
                    approvalForm.setValue("campaignId", value === "none" ? null : value)
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`approval-notes-${application.id}`}>Nota di review</Label>
                <Textarea
                  id={`approval-notes-${application.id}`}
                  placeholder="Note interne sulla decisione o sul setup iniziale."
                  {...approvalForm.register("reviewNotes")}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvataggio..." : "Approva e crea account"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`rejection-notes-${application.id}`}>Motivo / nota interna</Label>
              <Textarea
                id={`rejection-notes-${application.id}`}
                placeholder="Spiega brevemente perche la candidatura non entra nel programma."
                {...rejectionForm.register("reviewNotes")}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={isPending}>
                {isPending ? "Salvataggio..." : "Conferma rifiuto"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

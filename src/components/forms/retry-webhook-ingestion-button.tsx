"use client";

import { useTransition } from "react";

import { toast } from "sonner";

import { retryWebhookIngestionAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

interface RetryWebhookIngestionButtonProps {
  recordId: string;
}

export function RetryWebhookIngestionButton({
  recordId,
}: RetryWebhookIngestionButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await retryWebhookIngestionAction(recordId);

          if (!result.ok) {
            toast.error(result.message);
            return;
          }

          toast.success(result.message);
        });
      }}
    >
      {isPending ? "Nuovo tentativo..." : "Riprova"}
    </Button>
  );
}

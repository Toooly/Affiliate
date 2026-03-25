"use client";

import { useTransition } from "react";

import { toast } from "sonner";

import { retryStoreSyncJobAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

interface RetryStoreSyncJobButtonProps {
  jobId: string;
}

export function RetryStoreSyncJobButton({
  jobId,
}: RetryStoreSyncJobButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await retryStoreSyncJobAction(jobId);

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

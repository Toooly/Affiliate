"use client";

import { useTransition } from "react";

import { toast } from "sonner";

import { reviewSuspiciousEventAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

interface SuspiciousEventReviewFormProps {
  suspiciousEventId: string;
}

export function SuspiciousEventReviewForm({
  suspiciousEventId,
}: SuspiciousEventReviewFormProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await reviewSuspiciousEventAction({
              suspiciousEventId,
              status: "reviewed",
            });
            if (result.ok) {
              toast.success(result.message);
              return;
            }

            toast.error(result.message);
          })
        }
      >
        Segna come verificato
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await reviewSuspiciousEventAction({
              suspiciousEventId,
              status: "dismissed",
            });
            if (result.ok) {
              toast.success(result.message);
              return;
            }

            toast.error(result.message);
          })
        }
      >
        Archivia
      </Button>
    </div>
  );
}

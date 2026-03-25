"use client";

import { useState, useTransition } from "react";

import { CheckCircle2, CircleX } from "lucide-react";
import { toast } from "sonner";

import { reviewPromoCodeAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PromoCodeListItem } from "@/lib/types";

interface PromoCodeReviewFormProps {
  promoCode: PromoCodeListItem;
}

export function PromoCodeReviewForm({ promoCode }: PromoCodeReviewFormProps) {
  const [finalCode, setFinalCode] = useState(promoCode.code);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Input
        value={finalCode}
        aria-label="Codice finale"
        onChange={(event) => setFinalCode(event.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await reviewPromoCodeAction({
                promoCodeId: promoCode.id,
                status: "active",
                finalCode,
              });

              if (result.ok) {
                toast.success(result.message);
                return;
              }

              toast.error(result.message);
            })
          }
        >
          <CheckCircle2 className="size-4" />
          Approva
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await reviewPromoCodeAction({
                promoCodeId: promoCode.id,
                status: "rejected",
              });

              if (result.ok) {
                toast.success(result.message);
                return;
              }

              toast.error(result.message);
            })
          }
        >
          <CircleX className="size-4" />
          Rifiuta
        </Button>
      </div>
    </div>
  );
}

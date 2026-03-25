"use client";

import { useTransition } from "react";

import { PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { updateReferralLinkStatusAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

interface ReferralLinkStatusFormProps {
  linkId: string;
  isActive: boolean;
  isPrimary?: boolean;
}

export function ReferralLinkStatusForm({
  linkId,
  isActive,
  isPrimary = false,
}: ReferralLinkStatusFormProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={isActive ? "outline" : "default"}
      size="sm"
      disabled={isPending || isPrimary}
      onClick={() =>
        startTransition(async () => {
          const result = await updateReferralLinkStatusAction({
            linkId,
            isActive: !isActive,
          });

          if (result.ok) {
            toast.success(result.message);
            return;
          }

          toast.error(result.message);
        })
      }
    >
      {isActive ? <PauseCircle className="size-4" /> : <PlayCircle className="size-4" />}
      {isPrimary ? "Link principale" : isActive ? "Metti in pausa" : "Attiva"}
    </Button>
  );
}

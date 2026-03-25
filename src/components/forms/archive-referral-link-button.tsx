"use client";

import { useTransition } from "react";

import { Archive } from "lucide-react";
import { toast } from "sonner";

import { archiveReferralLinkAction } from "@/app/actions/influencer";
import { Button } from "@/components/ui/button";

interface ArchiveReferralLinkButtonProps {
  linkId: string;
  disabled?: boolean;
}

export function ArchiveReferralLinkButton({
  linkId,
  disabled = false,
}: ArchiveReferralLinkButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await archiveReferralLinkAction(linkId);
          if (result.ok) {
            toast.success(result.message);
            return;
          }

          toast.error(result.message);
        })
      }
    >
      <Archive className="size-4" />
      Archivia
    </Button>
  );
}

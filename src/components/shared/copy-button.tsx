"use client";

import { useTransition } from "react";

import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label: string;
  variant?: ButtonProps["variant"];
  className?: string;
}

export function CopyButton({
  value,
  label,
  variant = "outline",
  className,
}: CopyButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={cn(className)}
      onClick={() =>
        startTransition(async () => {
          await navigator.clipboard.writeText(value);
          toast.success(`${label} copiato`);
        })
      }
    >
      {isPending ? <Check className="size-4" /> : <Copy className="size-4" />}
      Copia
    </Button>
  );
}

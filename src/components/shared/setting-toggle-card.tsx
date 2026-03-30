import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SettingToggleCardProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description: ReactNode;
  className?: string;
}

export function SettingToggleCard({
  checked,
  onChange,
  label,
  description,
  className,
}: SettingToggleCardProps) {
  return (
    <label
      className={cn(
        "ui-soft-block ui-panel-block-interactive flex min-w-0 items-start gap-3",
        checked &&
          "border-primary/24 bg-[linear-gradient(180deg,rgba(235,241,255,0.98),rgba(227,236,255,0.94))] shadow-[0_18px_34px_-26px_rgba(36,84,211,0.22),inset_0_1px_0_rgba(255,255,255,0.82)]",
        className,
      )}
    >
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
      <span className="min-w-0">
        <span className="ui-wrap-pretty block text-sm font-medium text-foreground">{label}</span>
        <span className="ui-wrap-pretty mt-1 block text-sm leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

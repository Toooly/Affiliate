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
    <label className={cn("ui-soft-block flex min-w-0 items-start gap-3", className)}>
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
      <span className="min-w-0">
        <span className="ui-wrap-pretty block text-sm font-medium">{label}</span>
        <span className="ui-wrap-pretty mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

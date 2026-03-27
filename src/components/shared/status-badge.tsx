import { Badge } from "@/components/ui/badge";
import { formatUiLabel } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const variant =
    normalized === "approved" ||
    normalized === "active" ||
    normalized === "paid" ||
    normalized === "connected" ||
    normalized === "ready" ||
    normalized === "healthy" ||
    normalized === "processed" ||
    normalized === "succeeded" ||
    normalized === "installed" ||
    normalized === "granted"
      ? "success"
      : normalized === "primary"
        ? "default"
      : normalized === "draft" ||
          normalized === "inactive" ||
          normalized === "disabled" ||
          normalized === "ended" ||
          normalized === "not_connected" ||
          normalized === "archived" ||
          normalized === "ignored"
        ? "outline"
      : normalized === "pending" ||
          normalized === "processing" ||
          normalized === "scheduled" ||
          normalized === "attention_required" ||
          normalized === "restricted" ||
          normalized === "queued" ||
          normalized === "installing" ||
          normalized === "warning" ||
          normalized === "partial" ||
          normalized === "reauth_required"
        ? "warning"
        : normalized === "rejected" ||
            normalized === "cancelled" ||
            normalized === "failed" ||
            normalized === "error" ||
            normalized === "degraded" ||
            normalized === "missing"
        ? "danger"
        : "info";

  const dotClassName =
    variant === "success"
      ? "bg-success"
      : variant === "default"
        ? "bg-primary"
      : variant === "outline"
        ? "bg-muted-foreground"
      : variant === "warning"
        ? "bg-warning"
        : variant === "danger"
          ? "bg-destructive"
          : "bg-info";

  return (
    <Badge variant={variant} className={className}>
      <span className={`size-1.5 rounded-full ${dotClassName}`} />
      {formatUiLabel(normalized)}
    </Badge>
  );
}

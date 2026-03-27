import Link from "next/link";

import { ArrowRight, CheckCircle2, type LucideIcon } from "lucide-react";

import { LoginForm } from "@/components/forms/login-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AccessWorkspace = "merchant" | "affiliate";

interface AccessPanelProps {
  workspace: AccessWorkspace;
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  audience: string;
  highlights: string[];
  loginTitle: string;
  loginHint: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  showQuickFill?: boolean;
  tone?: "dark" | "light";
}

export function AccessPanel({
  workspace,
  icon: Icon,
  badge,
  title,
  description,
  audience,
  highlights,
  loginTitle,
  loginHint,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  showQuickFill = true,
  tone = "light",
}: AccessPanelProps) {
  const isDark = tone === "dark";

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[34px]",
        isDark ? "surface-admin" : "ui-card-soft",
      )}
    >
      <CardContent className="p-6 md:p-7 xl:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)] xl:gap-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-[18px] border",
                  isDark
                    ? "ui-surface-panel text-[color:var(--surface-copy)]"
                    : "ui-icon-chip border-0",
                )}
              >
                <Icon className="size-5" />
              </div>
              <Badge
                variant={isDark ? "secondary" : "outline"}
                className={cn(
                  isDark
                    ? "border-[color:var(--surface-border)] bg-[color:var(--surface-overlay)] text-[color:var(--surface-copy)] hover:bg-[color:var(--surface-overlay)]"
                    : "",
                )}
              >
                {badge}
              </Badge>
            </div>

            <Link href={primaryHref} className="group block rounded-[28px] focus:outline-none">
              <h3
                className={cn(
                  "mt-6 text-3xl font-semibold tracking-tight transition group-hover:opacity-90 md:text-[2.15rem]",
                  isDark ? "text-[color:var(--surface-foreground)]" : "text-foreground",
                )}
              >
                {title}
              </h3>
              <p
                className={cn(
                  "mt-4 max-w-2xl text-base leading-7",
                  isDark ? "ui-surface-copy" : "text-secondary-foreground",
                )}
              >
                {description}
              </p>

              <div
                className={cn(
                  "mt-6 rounded-[24px] border px-5 py-4 text-sm leading-7 transition",
                  isDark
                    ? "ui-surface-panel"
                    : "ui-panel-block ui-panel-block-strong text-secondary-foreground",
                )}
              >
                {audience}
              </div>

              <div className="mt-6 grid gap-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className={cn(
                      "flex items-start gap-3 rounded-[22px] border px-4 py-4 transition",
                      isDark
                        ? "ui-surface-panel"
                        : "ui-panel-block",
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        isDark ? "text-[color:var(--surface-copy)]" : "text-foreground",
                      )}
                    />
                    <div
                      className={cn(
                        "text-sm leading-6",
                        isDark ? "ui-surface-copy" : "text-secondary-foreground",
                      )}
                    >
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </Link>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant={isDark ? "secondary" : "default"}>
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {secondaryHref && secondaryLabel ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className={cn(isDark ? "ui-surface-action" : "")}
                >
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="ui-card-shell rounded-[30px] p-5 md:p-6">
            <div className="ui-surface-overline text-muted-foreground">
              {loginTitle}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{loginHint}</p>
            <LoginForm
              preferredWorkspace={workspace}
              expectedWorkspace={workspace}
              formId={`home-${workspace}`}
              submitLabel={
                workspace === "merchant"
                  ? "Accedi all'area admin"
                  : "Accedi all'area affiliato"
              }
              className="mt-6"
              prefillDemoCredentials={false}
              quickFillOptions={[workspace]}
              showQuickFill={showQuickFill}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

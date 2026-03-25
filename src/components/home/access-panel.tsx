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
        "overflow-hidden rounded-[34px] border shadow-[0_28px_84px_-52px_rgba(17,17,17,0.36)]",
        isDark ? "surface-admin" : "border-border/80 bg-white",
      )}
    >
      <CardContent className="p-6 md:p-7 xl:p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_360px] xl:gap-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-[18px] border",
                  isDark
                    ? "border-white/12 bg-white/8 text-white"
                    : "border-border/80 bg-secondary text-foreground",
                )}
              >
                <Icon className="size-5" />
              </div>
              <Badge
                variant={isDark ? "secondary" : "outline"}
                className={cn(isDark ? "bg-white/10 text-white hover:bg-white/10" : "")}
              >
                {badge}
              </Badge>
            </div>

            <Link href={primaryHref} className="group block rounded-[28px] focus:outline-none">
              <h3 className="mt-6 text-3xl font-semibold tracking-tight transition group-hover:opacity-90 md:text-[2.15rem]">
                {title}
              </h3>
              <p
                className={cn(
                  "mt-4 max-w-2xl text-base leading-7",
                  isDark ? "text-white/76" : "text-muted-foreground",
                )}
              >
                {description}
              </p>

              <div
                className={cn(
                  "mt-6 rounded-[24px] border px-5 py-4 text-sm leading-7 transition group-hover:border-foreground/20",
                  isDark
                    ? "border-white/12 bg-white/8 text-white/82"
                    : "border-border/70 bg-background/70 text-muted-foreground",
                )}
              >
                {audience}
              </div>

              <div className="mt-6 grid gap-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className={cn(
                      "flex items-start gap-3 rounded-[22px] border px-4 py-4 transition group-hover:border-foreground/20",
                      isDark
                        ? "border-white/10 bg-white/6"
                        : "border-border/70 bg-background/76",
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        isDark ? "text-white/84" : "text-foreground",
                      )}
                    />
                    <div
                      className={cn(
                        "text-sm leading-6",
                        isDark ? "text-white/76" : "text-muted-foreground",
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
                  className={cn(
                    isDark
                      ? "border-white/14 bg-white/6 text-white hover:bg-white/12 hover:text-white"
                      : "",
                  )}
                >
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-border/80 bg-white p-5 shadow-[0_24px_64px_-48px_rgba(17,17,17,0.2)] md:p-6">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
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

"use client";

import { useMemo, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoCredentials } from "@/lib/constants";
import type { LoginInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { loginSchema } from "@/lib/validations";
import { sanitizeNextPath } from "@/lib/auth/workspaces";

interface LoginFormProps {
  preferredWorkspace?: "merchant" | "affiliate" | "pending";
  expectedWorkspace?: "merchant" | "affiliate" | "pending";
  formId?: string;
  submitLabel?: string;
  className?: string;
  preferredRedirectTo?: string;
  prefillDemoCredentials?: boolean;
  quickFillOptions?: Array<"merchant" | "affiliate" | "pending">;
  showQuickFill?: boolean;
}

export function LoginForm({
  preferredWorkspace = "affiliate",
  expectedWorkspace,
  formId,
  submitLabel = "Apri area",
  className,
  preferredRedirectTo,
  prefillDemoCredentials = true,
  quickFillOptions = ["affiliate", "merchant", "pending"],
  showQuickFill = true,
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const initialValues =
    preferredWorkspace === "merchant"
      ? demoCredentials.admin
      : preferredWorkspace === "pending"
        ? demoCredentials.pending
        : demoCredentials.influencer;
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefillDemoCredentials ? initialValues.email : "",
      password: prefillDemoCredentials ? initialValues.password : "",
    },
  });
  const emailFieldId = formId ? `${formId}-email` : "email";
  const passwordFieldId = formId ? `${formId}-password` : "password";
  const quickFillLabels: Record<"merchant" | "affiliate" | "pending", string> = {
    merchant: "Carica demo merchant",
    affiliate: "Carica demo affiliato",
    pending: "Carica demo in revisione",
  };
  const quickFillCredentials = {
    merchant: demoCredentials.admin,
    affiliate: demoCredentials.influencer,
    pending: demoCredentials.pending,
  } as const;
  const resolvedWorkspace = expectedWorkspace ?? preferredWorkspace;
  const fallbackPath =
    resolvedWorkspace === "merchant"
      ? "/admin"
      : resolvedWorkspace === "pending"
        ? "/application/pending"
        : "/dashboard";
  const clientRedirectTo = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const hash = window.location.hash.replace(/^#/, "");
    const redirectFromHash = new URLSearchParams(hash).get("redirectTo");
    let redirectFromReferrer: string | null = null;

    try {
      if (document.referrer) {
        const referrerUrl = new URL(document.referrer);

        if (referrerUrl.origin === window.location.origin) {
          redirectFromReferrer = `${referrerUrl.pathname}${referrerUrl.search}`;
        }
      }
    } catch {
      redirectFromReferrer = null;
    }

    return sanitizeNextPath(redirectFromHash ?? redirectFromReferrer, resolvedWorkspace);
  }, [resolvedWorkspace]);
  const effectiveRedirectTo = clientRedirectTo ?? preferredRedirectTo;

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await loginAction({
        ...values,
        workspace: resolvedWorkspace,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      const actionRedirect = result.redirectTo ?? fallbackPath;
      const nextRedirect =
        effectiveRedirectTo &&
        ((actionRedirect === "/admin" && effectiveRedirectTo.startsWith("/admin")) ||
          (actionRedirect === "/dashboard" && effectiveRedirectTo.startsWith("/dashboard")) ||
          (actionRedirect === "/application/pending" &&
            effectiveRedirectTo.startsWith("/application/pending")) ||
          (actionRedirect === "/application/inactive" &&
            effectiveRedirectTo.startsWith("/application/inactive")))
          ? effectiveRedirectTo
          : actionRedirect;

      toast.success(result.message);
      window.location.assign(nextRedirect);
    });
  });

  return (
    <form onSubmit={onSubmit} className={cn("space-y-5", className)}>
      <div className="space-y-2.5">
        <Label htmlFor={emailFieldId}>Email o username</Label>
        <Input
          id={emailFieldId}
          type="text"
          placeholder="nome@azienda.it o username"
          autoComplete="username"
          {...form.register("email")}
        />
        {form.formState.errors.email?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor={passwordFieldId}>Password</Label>
        <Input
          id={passwordFieldId}
          type="password"
          placeholder="Inserisci la password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {showQuickFill ? (
        <div className="ui-soft-block ui-soft-block-strong rounded-[24px] p-4">
          <div className="ui-page-overline text-muted-foreground">
            Accesso demo
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            In ambiente demo non mostriamo credenziali in chiaro: puoi caricare direttamente
            un account prova del workspace corretto.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickFillOptions.map((workspace) => (
              <Button
                key={workspace}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.reset(quickFillCredentials[workspace])}
              >
                {quickFillLabels[workspace]}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Accesso in corso..." : submitLabel}
      </Button>
    </form>
  );
}

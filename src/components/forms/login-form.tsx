"use client";

import { useMemo, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

export function LoginForm({
  preferredWorkspace = "affiliate",
  expectedWorkspace,
  formId,
  submitLabel = "Apri area",
  className,
  preferredRedirectTo,
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const emailFieldId = formId ? `${formId}-email` : "email";
  const passwordFieldId = formId ? `${formId}-password` : "password";
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

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Accesso in corso..." : submitLabel}
      </Button>
    </form>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
    merchant: "Usa demo admin",
    affiliate: "Usa demo affiliato",
    pending: "Usa demo in attesa",
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
        preferredRedirectTo &&
        ((actionRedirect === "/admin" && preferredRedirectTo.startsWith("/admin")) ||
          (actionRedirect === "/dashboard" && preferredRedirectTo.startsWith("/dashboard")) ||
          (actionRedirect === "/application/pending" &&
            preferredRedirectTo.startsWith("/application/pending")))
          ? preferredRedirectTo
          : actionRedirect;

      toast.success(result.message);
      router.push(nextRedirect);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Label htmlFor={emailFieldId}>Email o username</Label>
        <Input
          id={emailFieldId}
          type="text"
          placeholder="nome@azienda.it o username"
          {...form.register("email")}
        />
        <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={passwordFieldId}>Password</Label>
        <Input
          id={passwordFieldId}
          type="password"
          placeholder="Inserisci la password"
          {...form.register("password")}
        />
        <p className="text-sm text-destructive">{form.formState.errors.password?.message}</p>
      </div>

      {showQuickFill ? (
        <div className="ui-panel-block ui-panel-block-strong">
          <div className="ui-surface-overline">
            Riempimento rapido account demo
          </div>
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

"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { registerAffiliateAction } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AffiliateInvitePublicSummary,
  AffiliateRegistrationInput,
} from "@/lib/types";
import { countryOptions } from "@/lib/constants";
import { affiliateRegistrationSchema } from "@/lib/validations";

interface AffiliateRegistrationFormProps {
  invite?: AffiliateInvitePublicSummary | null;
}

export function AffiliateRegistrationForm({
  invite = null,
}: AffiliateRegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultValues: AffiliateRegistrationInput = {
    fullName: invite?.invitedName ?? "",
    email: invite?.invitedEmail ?? "",
    country: "Italia",
    password: "",
    consentAccepted: true,
    inviteToken: invite?.token,
  };
  const form = useForm<AffiliateRegistrationInput>({
    resolver: zodResolver(affiliateRegistrationSchema),
    defaultValues,
  });
  const consentAccepted = useWatch({
    control: form.control,
    name: "consentAccepted",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await registerAffiliateAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push(result.redirectTo ?? "/application/pending");
    });
  });

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      <input type="hidden" {...form.register("inviteToken")} />

      <div className="space-y-2.5">
        <Label htmlFor="register-fullName">Nome e cognome</Label>
        <Input
          id="register-fullName"
          placeholder="Nome completo"
          autoComplete="name"
          {...form.register("fullName")}
        />
        {form.formState.errors.fullName?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="tuo@email.com"
          autoComplete="email"
          readOnly={Boolean(invite?.invitedEmail)}
          {...form.register("email")}
        />
        {invite?.invitedEmail ? (
          <p className="text-sm text-muted-foreground">
            Questo invito e associato a {invite.invitedEmail}.
          </p>
        ) : null}
        {form.formState.errors.email?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="register-country">Paese</Label>
        <Input id="register-country" list="register-country-options" {...form.register("country")} />
        <datalist id="register-country-options">
          {countryOptions.map((country) => (
            <option key={country} value={country} />
          ))}
        </datalist>
        {form.formState.errors.country?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>
        ) : null}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="Minimo 8 caratteri"
          autoComplete="new-password"
          {...form.register("password")}
        />
        <p className="text-sm text-muted-foreground">
          {invite
            ? "Questo onboarding attiva subito il tuo accesso partner e collega il profilo al programma corretto."
            : "Dopo la registrazione il profilo entra in revisione, ma le credenziali restano gia attive per controllare lo stato dell'account."}
        </p>
        {form.formState.errors.password?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      <label className="ui-soft-block ui-soft-block-strong flex items-start gap-3 rounded-[24px] p-4">
        <Checkbox
          checked={consentAccepted}
          onCheckedChange={(checked) =>
            form.setValue("consentAccepted", Boolean(checked), { shouldValidate: true })
          }
        />
        <span className="text-sm leading-6 text-muted-foreground">
          Accetto i termini del programma affiliate e l&apos;informativa privacy, e autorizzo le
          comunicazioni relative a registrazione, review e attivazione account.
        </span>
      </label>
      {form.formState.errors.consentAccepted?.message ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.consentAccepted.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Hai gia un account?{" "}
          <Link href="/login/affiliate" className="font-medium text-foreground underline underline-offset-4">
            Accedi
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isPending}>
          {isPending
            ? "Registrazione in corso..."
            : invite
              ? "Attiva account affiliato"
              : "Registrati"}
        </Button>
      </div>
    </form>
  );
}

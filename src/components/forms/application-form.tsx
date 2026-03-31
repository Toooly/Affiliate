"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { submitApplicationAction } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { audienceSizeOptions, countryOptions, platformOptions } from "@/lib/constants";
import type { ApplicationInput } from "@/lib/types";
import { applicationSchema } from "@/lib/validations";

const defaultValues: ApplicationInput = {
  fullName: "",
  email: "",
  password: "",
  instagramHandle: "",
  tiktokHandle: "",
  youtubeHandle: "",
  primaryPlatform: "instagram",
  audienceSize: "1k-5k",
  country: "Italia",
  niche: "",
  message: "",
  consentAccepted: true,
};

export function ApplicationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues,
  });
  const consentAccepted = useWatch({
    control: form.control,
    name: "consentAccepted",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitApplicationAction(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push(result.redirectTo ?? "/login/affiliate");
    });
  });

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <section className="ui-soft-block ui-soft-block-strong rounded-[28px] p-5">
        <div className="space-y-2">
          <div className="ui-page-overline text-muted-foreground">Identita e contatto</div>
          <p className="text-sm leading-7 text-muted-foreground">
            Queste informazioni identificano il profilo partner e ci permettono di contattarti
            durante la review.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2.5">
            <Label htmlFor="fullName">Nome e cognome</Label>
            <Input
              id="fullName"
              placeholder="Luna Voss"
              autoComplete="name"
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="email">Email di lavoro</Label>
            <Input
              id="email"
              type="email"
              placeholder="tuo@email.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2.5 md:col-span-2">
            <Label htmlFor="country">Paese</Label>
            <Input id="country" list="country-options" {...form.register("country")} />
            <datalist id="country-options">
              {countryOptions.map((country) => (
                <option key={country} value={country} />
              ))}
            </datalist>
            {form.formState.errors.country?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="ui-soft-block rounded-[28px] p-5">
        <div className="space-y-2">
          <div className="ui-page-overline text-muted-foreground">Canali e audience</div>
          <p className="text-sm leading-7 text-muted-foreground">
            Il team usa questi dati per valutare fit, copertura, canale principale e qualita
            del profilo nel programma.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2.5">
            <Label>Piattaforma principale</Label>
            <Select
              defaultValue={form.getValues("primaryPlatform")}
              onValueChange={(value) =>
                form.setValue("primaryPlatform", value as ApplicationInput["primaryPlatform"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Scegli una piattaforma" />
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.primaryPlatform?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.primaryPlatform.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <Label>Dimensione audience</Label>
            <Select
              defaultValue={form.getValues("audienceSize")}
              onValueChange={(value) =>
                form.setValue("audienceSize", value as ApplicationInput["audienceSize"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Scegli la dimensione audience" />
              </SelectTrigger>
              <SelectContent>
                {audienceSizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.audienceSize?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.audienceSize.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="instagramHandle">Handle Instagram</Label>
            <Input
              id="instagramHandle"
              placeholder="@lunavoss"
              autoComplete="off"
              {...form.register("instagramHandle")}
            />
            {form.formState.errors.instagramHandle?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.instagramHandle.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="tiktokHandle">Handle TikTok (opzionale)</Label>
            <Input
              id="tiktokHandle"
              placeholder="@lunavoss"
              autoComplete="off"
              {...form.register("tiktokHandle")}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="youtubeHandle">Handle YouTube (opzionale)</Label>
            <Input
              id="youtubeHandle"
              placeholder="@lunavossstudio"
              autoComplete="off"
              {...form.register("youtubeHandle")}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="niche">Nicchia editoriale</Label>
            <Input
              id="niche"
              placeholder="Lifestyle, beauty, tech..."
              {...form.register("niche")}
            />
            {form.formState.errors.niche?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.niche.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="ui-soft-block ui-soft-block-strong rounded-[28px] p-5">
        <div className="space-y-2">
          <div className="ui-page-overline text-muted-foreground">Accesso futuro e motivazione</div>
          <p className="text-sm leading-7 text-muted-foreground">
            La password che imposti ora resta associata al profilo partner e sara la tua credenziale
            iniziale quando l&apos;accesso verra approvato.
          </p>
        </div>

        <div className="mt-5 grid gap-5">
          <div className="space-y-2.5">
            <Label htmlFor="password">Password iniziale del portale partner</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 8 caratteri"
              autoComplete="new-password"
              {...form.register("password")}
            />
            <p className="text-sm text-muted-foreground">
              Se accedi prima dell&apos;approvazione, vedrai semplicemente lo stato della revisione.
            </p>
            {form.formState.errors.password?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="message">Perche vuoi entrare nel programma?</Label>
            <Textarea
              id="message"
              placeholder="Raccontaci audience, stile di contenuto, canali principali e perche sei un buon fit per il programma."
              {...form.register("message")}
            />
            {form.formState.errors.message?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <label className="ui-soft-block ui-soft-block-strong flex items-start gap-3 rounded-[24px] p-4">
        <Checkbox
          checked={consentAccepted}
          onCheckedChange={(checked) =>
            form.setValue("consentAccepted", Boolean(checked), { shouldValidate: true })
          }
        />
        <span className="text-sm leading-6 text-muted-foreground">
          Accetto i termini del programma affiliate e l&apos;informativa privacy, e autorizzo l&apos;invio
          di email relative a candidatura, esito review e attivazione account.
        </span>
      </label>
      {form.formState.errors.consentAccepted?.message ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.consentAccepted.message}
        </p>
      ) : null}

      <div className="ui-card-stage rounded-[28px] px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="font-semibold">Invio in revisione</div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Dopo l&apos;invio il profilo entra in review. Riceverai una conferma e potrai monitorare
              lo stato dal percorso di accesso affiliato finche il team non attiva il portale.
            </p>
          </div>
          <Button type="submit" size="lg" className="w-full lg:w-auto" disabled={isPending}>
            {isPending ? "Invio candidatura..." : "Invia candidatura"}
          </Button>
        </div>
      </div>
    </form>
  );
}

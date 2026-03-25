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
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-[28px] border border-border/70 bg-secondary/32 p-5">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Dati creator
        </div>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome e cognome</Label>
            <Input id="fullName" placeholder="Luna Voss" {...form.register("fullName")} />
            <p className="text-sm text-foreground">{form.formState.errors.fullName?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tuo@email.com" {...form.register("email")} />
            <p className="text-sm text-foreground">{form.formState.errors.email?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 8 caratteri"
              {...form.register("password")}
            />
            <p className="text-sm text-foreground">{form.formState.errors.password?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Paese</Label>
            <Input id="country" list="country-options" {...form.register("country")} />
            <datalist id="country-options">
              {countryOptions.map((country) => (
                <option key={country} value={country} />
              ))}
            </datalist>
            <p className="text-sm text-foreground">{form.formState.errors.country?.message}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border/70 bg-background/70 p-5">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Profilo audience
        </div>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="instagramHandle">Handle Instagram</Label>
            <Input id="instagramHandle" placeholder="@lunavoss" {...form.register("instagramHandle")} />
            <p className="text-sm text-foreground">{form.formState.errors.instagramHandle?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktokHandle">Handle TikTok</Label>
            <Input id="tiktokHandle" placeholder="@lunavoss" {...form.register("tiktokHandle")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeHandle">Handle YouTube</Label>
            <Input id="youtubeHandle" placeholder="@lunavossstudio" {...form.register("youtubeHandle")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="niche">Nicchia</Label>
            <Input id="niche" placeholder="Lifestyle, beauty, tech..." {...form.register("niche")} />
            <p className="text-sm text-foreground">{form.formState.errors.niche?.message}</p>
          </div>
          <div className="space-y-2">
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
            <p className="text-sm text-foreground">{form.formState.errors.primaryPlatform?.message}</p>
          </div>
          <div className="space-y-2">
            <Label>Dimensione audience</Label>
            <Select
              defaultValue={form.getValues("audienceSize")}
              onValueChange={(value) =>
                form.setValue("audienceSize", value as ApplicationInput["audienceSize"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Scegli la dimensione dell&apos;audience" />
              </SelectTrigger>
              <SelectContent>
                {audienceSizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-foreground">{form.formState.errors.audienceSize?.message}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Perche vuoi entrare nel programma?</Label>
        <Textarea
          id="message"
          placeholder="Raccontaci chi segui, il tuo stile di contenuto e perche saresti un ottimo fit per il programma."
          {...form.register("message")}
        />
        <p className="text-sm text-foreground">{form.formState.errors.message?.message}</p>
      </div>
      <label className="flex items-start gap-3 rounded-3xl border border-border/70 bg-secondary/60 p-4">
        <Checkbox
          checked={consentAccepted}
          onCheckedChange={(checked) =>
            form.setValue("consentAccepted", Boolean(checked), { shouldValidate: true })
          }
        />
        <span className="text-sm text-muted-foreground">
          Accetto i termini del programma affiliate e l&apos;informativa privacy, e autorizzo l&apos;invio di email relative a candidatura e account.
        </span>
      </label>
      <p className="text-sm text-foreground">{form.formState.errors.consentAccepted?.message}</p>
      <div className="flex flex-col gap-4 rounded-[28px] border border-border/80 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-7 text-muted-foreground">
          Stai creando un account creator in attesa di approvazione. L&apos;accesso alla dashboard si sblocca solo dopo la revisione.
        </p>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? "Invio..." : "Invia candidatura"}
        </Button>
      </div>
    </form>
  );
}



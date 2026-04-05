import { APP_NAME } from "@/lib/constants";

function emailShell({
  brandName = APP_NAME,
  title,
  preheader,
  body,
  ctaLabel,
  ctaUrl,
}: {
  brandName?: string;
  title: string;
  preheader: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  return `
    <div style="margin:0;background:#f7f3ec;padding:32px 16px;font-family:Arial,sans-serif;color:#141922;">
      <div style="max-width:640px;margin:0 auto;border:1px solid rgba(20,25,34,0.08);background:#fffdfa;border-radius:28px;overflow:hidden;box-shadow:0 40px 80px -50px rgba(16,20,30,0.28);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#182544 0%,#284f9f 100%);color:#fff;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.72;">${brandName}</div>
          <h1 style="margin:12px 0 0;font-size:30px;line-height:1.1;">${title}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;opacity:0.82;">${preheader}</p>
        </div>
        <div style="padding:32px;">
          <div style="font-size:15px;line-height:1.7;color:#404857;">${body}</div>
          ${
            ctaLabel && ctaUrl
              ? `<div style="margin-top:28px;">
                  <a href="${ctaUrl}" style="display:inline-block;background:#244a9a;color:#fff;text-decoration:none;padding:14px 20px;border-radius:999px;font-weight:600;box-shadow:0 20px 42px -28px rgba(24,56,121,0.42);">${ctaLabel}</a>
                </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

export function applicationReceivedTemplate(
  fullName: string,
  brandName = APP_NAME,
) {
  return {
    subject: "Abbiamo ricevuto la tua candidatura affiliato",
    html: emailShell({
      brandName,
      title: `Grazie, ${fullName.split(" ")[0]}`,
      preheader: "La tua candidatura è in revisione. Ti aggiorneremo al più presto.",
      body: `
        <p>Abbiamo ricevuto la tua candidatura affiliato e l'abbiamo inserita nella coda di revisione.</p>
        <p>Se verrai approvato, riceverai il tuo codice sconto personale, il referral link dedicato e l'accesso alla dashboard.</p>
      `,
    }),
  };
}

export function applicationApprovedTemplate(
  fullName: string,
  code: string,
  link: string,
  brandName = APP_NAME,
) {
  return {
    subject: "Il tuo account affiliato è stato approvato",
    html: emailShell({
      brandName,
      title: "Sei ufficialmente nel programma",
      preheader: "La tua dashboard affiliato è pronta.",
      body: `
        <p>Ciao ${fullName}, la tua candidatura è stata approvata.</p>
        <p><strong>Codice sconto:</strong> ${code}</p>
        <p><strong>Referral link:</strong> ${link}</p>
        <p>Ora puoi monitorare click, conversioni, fatturato e stato dei payout da un unico spazio.</p>
      `,
      ctaLabel: "Apri la dashboard",
      ctaUrl: "/dashboard",
    }),
  };
}

export function inviteActivatedTemplate(fullName: string, brandName = APP_NAME) {
  return {
    subject: "Il tuo accesso affiliato è pronto",
    html: emailShell({
      brandName,
      title: "Account affiliato attivato",
      preheader: "Puoi entrare subito nel portale affiliato con le credenziali che hai appena creato.",
      body: `
        <p>Ciao ${fullName}, il tuo account affiliato è stato attivato correttamente tramite link invito.</p>
        <p>Ora puoi entrare nel portale affiliato, recuperare il tuo referral link personale e monitorare conversioni, commissioni e payout.</p>
      `,
      ctaLabel: "Apri il portale affiliato",
      ctaUrl: "/dashboard",
    }),
  };
}

export function affiliateInviteTemplate(options: {
  registrationUrl: string;
  fullName?: string | null;
  campaignName?: string | null;
  expiresAt?: string | null;
  brandName?: string;
}) {
  const firstName = options.fullName?.trim().split(" ")[0] ?? "Affiliato";
  const expiryLabel = options.expiresAt
    ? new Intl.DateTimeFormat("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(options.expiresAt))
    : null;

  return {
    subject: "Il tuo accesso al portale affiliato è pronto",
    html: emailShell({
      brandName: options.brandName,
      title: `Invito pronto per ${firstName}`,
      preheader:
        "Apri il link, completa la registrazione e accedi subito al tuo portale affiliato.",
      body: `
        <p>Ciao ${firstName}, hai ricevuto un invito ufficiale al programma affiliati.</p>
        <p>Dal portale troverai il tuo codice sconto personale, i link condivisibili, lo stato delle conversioni e i payout.</p>
        ${
          options.campaignName
            ? `<p><strong>Campagna iniziale:</strong> ${options.campaignName}</p>`
            : ""
        }
        ${
          expiryLabel
            ? `<p><strong>Validità link:</strong> fino al ${expiryLabel}</p>`
            : ""
        }
      `,
      ctaLabel: "Attiva account affiliato",
      ctaUrl: options.registrationUrl,
    }),
  };
}

export function applicationRejectedTemplate(
  fullName: string,
  brandName = APP_NAME,
) {
  return {
    subject: "Aggiornamento sulla tua candidatura affiliato",
    html: emailShell({
      brandName,
      title: "Grazie per esserti candidato",
      preheader: "Abbiamo rivisto la candidatura e al momento non proseguiremo.",
      body: `
        <p>Ciao ${fullName}, grazie ancora per l'interesse verso il programma.</p>
        <p>Per questo ciclo non andremo avanti con la candidatura, ma potremmo riaprire opportunità pertinenti in futuro.</p>
      `,
    }),
  };
}

export function welcomeTemplate(fullName: string, brandName = APP_NAME) {
  return {
    subject: "Benvenuto nel programma affiliati",
    html: emailShell({
      brandName,
      title: "Benvenuto a bordo",
      preheader: "Tutto quello che ti serve è ora disponibile nella tua dashboard affiliato.",
      body: `
        <p>Ciao ${fullName}, benvenuto nel programma.</p>
        <p>Nella dashboard trovi referral link, asset promozionali, dettagli payout e analytics performance per gestire tutto da un unico posto.</p>
      `,
      ctaLabel: "Vai alla dashboard",
      ctaUrl: "/dashboard",
    }),
  };
}

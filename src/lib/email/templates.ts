import { APP_NAME } from "@/lib/constants";

function emailShell({
  title,
  preheader,
  body,
  ctaLabel,
  ctaUrl,
}: {
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
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.72;">${APP_NAME}</div>
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

export function applicationReceivedTemplate(fullName: string) {
  return {
    subject: "Abbiamo ricevuto la tua candidatura creator",
    html: emailShell({
      title: `Grazie, ${fullName.split(" ")[0]}`,
      preheader: "La tua candidatura e in revisione. Ti aggiorneremo al piu presto.",
      body: `
        <p>Abbiamo ricevuto la tua candidatura creator e l'abbiamo inserita nella coda di revisione.</p>
        <p>Se verrai approvato, riceverai il tuo codice sconto personale, il referral link dedicato e l'accesso alla dashboard.</p>
      `,
    }),
  };
}

export function applicationApprovedTemplate(fullName: string, code: string, link: string) {
  return {
    subject: "Il tuo account creator e stato approvato",
    html: emailShell({
      title: "Sei ufficialmente nel programma",
      preheader: "La tua dashboard creator e pronta.",
      body: `
        <p>Ciao ${fullName}, la tua candidatura e stata approvata.</p>
        <p><strong>Codice sconto:</strong> ${code}</p>
        <p><strong>Referral link:</strong> ${link}</p>
        <p>Ora puoi monitorare click, conversioni, fatturato e stato dei payout da un unico spazio.</p>
      `,
      ctaLabel: "Apri la dashboard",
      ctaUrl: "/dashboard",
    }),
  };
}

export function inviteActivatedTemplate(fullName: string) {
  return {
    subject: "Il tuo accesso affiliato e pronto",
    html: emailShell({
      title: "Account partner attivato",
      preheader: "Puoi entrare subito nel portale affiliato con le credenziali che hai appena creato.",
      body: `
        <p>Ciao ${fullName}, il tuo account affiliato e stato attivato correttamente tramite link invito.</p>
        <p>Ora puoi entrare nel portale partner, recuperare il tuo referral link personale e monitorare conversioni, commissioni e payout.</p>
      `,
      ctaLabel: "Apri il portale affiliato",
      ctaUrl: "/dashboard",
    }),
  };
}

export function applicationRejectedTemplate(fullName: string) {
  return {
    subject: "Aggiornamento sulla tua candidatura creator",
    html: emailShell({
      title: "Grazie per esserti candidato",
      preheader: "Abbiamo rivisto la candidatura e al momento non proseguiremo.",
      body: `
        <p>Ciao ${fullName}, grazie ancora per l'interesse verso il programma.</p>
        <p>Per questo ciclo non andremo avanti con la candidatura, ma potremmo riaprire opportunita pertinenti in futuro.</p>
      `,
    }),
  };
}

export function welcomeTemplate(fullName: string) {
  return {
    subject: "Benvenuto nel programma creator",
    html: emailShell({
      title: "Benvenuto a bordo",
      preheader: "Tutto quello che ti serve e ora disponibile nella tua dashboard creator.",
      body: `
        <p>Ciao ${fullName}, benvenuto nel programma.</p>
        <p>Nella dashboard trovi referral link, asset promozionali, dettagli payout e analytics performance per gestire tutto da un unico posto.</p>
      `,
      ctaLabel: "Vai alla dashboard",
      ctaUrl: "/dashboard",
    }),
  };
}

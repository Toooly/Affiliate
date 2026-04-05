import { Resend } from "resend";

import { env, isResendConfigured } from "@/lib/env";

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string | string[];
}) {
  if (!isResendConfigured()) {
    console.info("Email skipped because Resend is not configured", {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }

  const resend = new Resend(env.resendApiKey);

  await resend.emails.send({
    from: options.from ?? env.resendFromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: (options.replyTo ?? env.resendReplyTo) || undefined,
  });

  return true;
}

import type { Context } from 'hono';
import { createTransport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { apiLogger } from './logger';

const transporter = createTransport({
  service: 'SMTP',
  host: process.env.NODEMAILER_HOST!,
  port: +process.env.NODEMAILER_PORT!,
  auth: {
    user: process.env.NODEMAILER_USER!,
    pass: process.env.NODEMAILER_PASS!
  }
});

// Mail must come from the account it is sent through. Claiming another domain's address fails
// that domain's SPF, and Imperial's Microsoft 365 then quietly quarantines the email as spoofed:
// it is "sent", but never arrives.
const address = process.env.MAIL_FROM || process.env.NODEMAILER_USER!;
// No display name unless one is set: Imperial flags outside mail whose name looks like an Imperial
// sender (anything with "DoCSoc" in it, since docsoc@ic.ac.uk exists) as impersonation.
const from = process.env.MAIL_FROM_NAME
  ? { name: process.env.MAIL_FROM_NAME, address }
  : address;

export const sendEmail = async (
  ctx: Context,
  to: string,
  subject: string,
  text: string,
  html: string,
  attachments: Mail.Attachment[] = []
) => {
  if (process.env.NODE_ENV !== 'production') {
    apiLogger.info(
      ctx,
      'Email not sent (not in production)\n',
      `To: ${to}\n`,
      `Subject: ${subject}\n`,
      `Text: ${text}\n`,
      `HTML: ${html}`
    );
    return;
  }

  await transporter.sendMail({
    from,
    to: to,
    subject: subject,
    text: text,
    html: html,
    attachments: attachments
  });
};

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
    from: '"DoCSoc" <docsoc@ic.ac.uk>',
    to: to,
    subject: subject,
    text: text,
    html: html,
    attachments: attachments
  });
};

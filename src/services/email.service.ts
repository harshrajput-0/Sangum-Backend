import { transporter } from "../config/mail.js";
import { env } from "../config/env.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  return transporter.sendMail({
    from: `"Sangam" <${env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
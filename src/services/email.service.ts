import { transporter } from "../config/mail.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: EmailOptions) {
  return transporter.sendMail({
    from: `"Sangam" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
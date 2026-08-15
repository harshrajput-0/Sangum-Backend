import { sgMail } from "../config/mail.js";
import { env } from "../config/env.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  await sgMail.send({
    to,
    from: env.EMAIL_FROM,
    subject,
    html,
  });
}








// import { resend } from "../config/mail.js";
// import { env } from "../config/env.js";

// interface EmailOptions {
//   to: string;
//   subject: string;
//   html: string;
// }

// export async function sendEmail({ to, subject, html }: EmailOptions) {
//   const { error } = await resend.emails.send({
//     from: `Sangam <${env.EMAIL_FROM}>`,
//     to,
//     subject,
//     html,
//   });

//   if (error) {
//     throw new Error(`Resend failed: ${error.message}`);
//   }
// }
import { sendEmail } from "../../services/email.service.js";
import type { ContactInput } from "./contact.validation.js";

export const sendMessage = async ({
  name,
  email,
  message,
}: ContactInput) => {
  await sendEmail({
    to: process.env.EMAIL_USER!,
    subject: `New contact message from ${name}`,
    html: `
      <h2>New Contact Message</h2>

      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>

      <h3>Message</h3>
      <p>${message}</p>
    `,
  });
};
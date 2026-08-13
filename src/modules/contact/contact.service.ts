import { sendEmail } from "../../services/email.service.js";
import type { ContactInput } from "./contact.validation.js";

// contact.service.ts
export const sendMessage = ({ name, email, message }: ContactInput) => {
  sendEmail({
    to: process.env.EMAIL_USER!,
    subject: `New contact message from ${name}`,
    html: `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <h3>Message</h3>
      <p>${message}</p>
    `,
  }).catch((err) => console.error("Contact email failed:", err));
};
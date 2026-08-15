import { BrevoClient } from "@getbrevo/brevo";
import { env } from "./env.js";

// config/mail.ts — temporary debug, remove after confirming
console.log("BREVO_API_KEY length:", env.BREVO_API_KEY.length);
console.log("BREVO_API_KEY starts with:", env.BREVO_API_KEY.slice(0, 8));
console.log("BREVO_API_KEY ends with:", env.BREVO_API_KEY.slice(-4));

export const brevo = new BrevoClient({ apiKey: env.BREVO_API_KEY });



// ===| RESEND |================================================
// import { Resend } from "resend";
// import { env } from "./env.js";

// export const resend = new Resend(env.RESEND_API_KEY);
import { BrevoClient } from "@getbrevo/brevo";
import { env } from "./env.js";

export const brevo = new BrevoClient({ apiKey: env.BREVO_API_KEY });



// ===| RESEND |================================================
// import { Resend } from "resend";
// import { env } from "./env.js";

// export const resend = new Resend(env.RESEND_API_KEY);
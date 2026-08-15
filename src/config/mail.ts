// import { Resend } from "resend";
// import { env } from "./env.js";

// export const resend = new Resend(env.RESEND_API_KEY);



import sgMail from "@sendgrid/mail";
import { env } from "./env.js";

sgMail.setApiKey(env.SENDGRID_API_KEY);

export { sgMail };
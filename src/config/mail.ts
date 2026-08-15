// temporary test file, run with your real BREVO_API_KEY
import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({ apiKey: "your-real-key" });

brevo.account.getAccount()
  .then((res) => console.log("SDK account call SUCCESS", res))
  .catch((err) => console.log("SDK account call FAILED", err.statusCode, err.body));



// ===| RESEND |================================================
// import { Resend } from "resend";
// import { env } from "./env.js";

// export const resend = new Resend(env.RESEND_API_KEY);
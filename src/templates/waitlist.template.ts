export function waitlistTemplate(name?: string) {
  return `
    <h2>Welcome to Sangam!</h2>

    <p>Hi ${name ?? "there"},</p>

    <p>Thanks for joining our waitlist.</p>

    <p>We'll notify you as soon as we're ready.</p>
  `;
}
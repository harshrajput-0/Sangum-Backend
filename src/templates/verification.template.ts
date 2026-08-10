export function verificationTemplate(verifyUrl: string, name?: string) {
  return `
    <h2>Verify your email</h2>

    <p>Hi ${name ?? "there"},</p>

    <p>Click the link below to verify your email address. This link expires in 24 hours.</p>

    <p><a href="${verifyUrl}">${verifyUrl}</a></p>

    <p>If you didn't create an account, you can safely ignore this email.</p>
  `;
}
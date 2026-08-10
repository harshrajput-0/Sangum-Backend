export function resetPasswordTemplate(resetUrl: string, name?: string) {
  return `
    <h2>Reset your password</h2>

    <p>Hi ${name ?? "there"},</p>

    <p>We received a request to reset your password. This link expires in 1 hour.</p>

    <p><a href="${resetUrl}">${resetUrl}</a></p>

    <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
  `;
}
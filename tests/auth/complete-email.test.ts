import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../src/app.js";
import Account, { AuthProvider } from "../../src/modules/auth/account.model.js";
import User, { UserRole } from "../../src/modules/users/user.model.js";
import { generateAccessToken } from "../../src/utils/generateTokens.js";
import { sendEmail } from "../../src/services/email.service.js";

const app = createApp();
const mockSendEmail = vi.mocked(sendEmail);

async function createOAuthAccountWithNoEmail() {
  const userId = new mongoose.Types.ObjectId();
  const accountId = new mongoose.Types.ObjectId();

  const user = await User.create({
    _id: userId,
    accountId,
    username: `test_user_${userId.toString().slice(-6)}`,
    displayName: "Test OAuth User",
    role: UserRole.USER,
    isProfileComplete: false,
  });

  // No `email` field at all — matches how handleOAuthLogin actually builds
  // a no-email account in production (spreading it in conditionally),
  // rather than an explicit `email: null`, which the schema's type doesn't
  // accept as a valid value for this field.
  const account = await Account.create({
    _id: accountId,
    userId,
    authProviders: [{ provider: AuthProvider.GITHUB, providerId: "12345", connectedAt: new Date() }],
    isVerified: false,
  });

  const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
  return { accessToken, accountId: account._id.toString() };
}

describe("POST /api/v1/auth/complete-email", () => {
  it("sets the email and sends a verification email", async () => {
    const { accessToken } = await createOAuthAccountWithNoEmail();
    mockSendEmail.mockClear();

    const res = await request(app)
      .post("/api/v1/auth/complete-email")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: "completed.email@example.com" });

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    const call = mockSendEmail.mock.calls[0];
    expect(call).toBeDefined();
    expect(call?.[0].to).toBe("completed.email@example.com");
  });

  it("rejects a second attempt once the account already has an email", async () => {
    const { accessToken } = await createOAuthAccountWithNoEmail();
    await request(app)
      .post("/api/v1/auth/complete-email")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: "first@example.com" });

    const res = await request(app)
      .post("/api/v1/auth/complete-email")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: "second@example.com" });

    expect(res.status).toBe(400);
  });

  it("rejects an email that's already taken by another account", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "already.taken@example.com", password: "StrongPass123!" });

    const { accessToken } = await createOAuthAccountWithNoEmail();

    const res = await request(app)
      .post("/api/v1/auth/complete-email")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: "already.taken@example.com" });

    expect(res.status).toBe(409);
  });
});
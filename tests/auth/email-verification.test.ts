import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { sendEmail } from "../../src/services/email.service.js";
import { uniqueUsername } from "../helpers/testUsers.js";

const app = createApp();
const mockSendEmail = vi.mocked(sendEmail);

function extractToken(urlSegment: string): string {
  const lastCall = mockSendEmail.mock.calls.at(-1);
  const html = lastCall?.[0]?.html ?? "";
  // Verification tokens are JWTs now (header.payload.signature, each
  // segment base64url) rather than 64-char hex strings.
  const match = html.match(
    new RegExp(`${urlSegment}/([A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+)`),
  );
  const token = match?.[1];

  if (!token) {
    throw new Error(`No token found in the last sent email for ${urlSegment}`);
  }

  return token;
}

async function registerAndGetToken(email: string) {
  const res = await request(app).post("/api/v1/auth/register").send({
    email,
    password: "StrongPass123!",
    username: uniqueUsername(),
  });
  return {
    accessToken: res.body.data.accessToken as string,
    verifyToken: extractToken("verify-email"), // registration itself sends this one
  };
}

describe("POST /api/v1/auth/verify-email/:token", () => {
  it("verifies the account and returns 200 JSON", async () => {
    const { verifyToken } = await registerAndGetToken(
      "verify.test@example.com",
    );

    const res = await request(app).post(
      `/api/v1/auth/verify-email/${verifyToken}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("is idempotent — re-clicking the same (or an older) link after verification succeeds quietly instead of erroring", async () => {
    const { verifyToken } = await registerAndGetToken(
      "verify.reuse@example.com",
    );

    await request(app).post(`/api/v1/auth/verify-email/${verifyToken}`);

    // Same token, used again — must not error. This is the actual fix
    // for "clicking an old link after already verifying doesn't work":
    // it should just be a safe no-op, not a hard failure.
    const reuseRes = await request(app).post(
      `/api/v1/auth/verify-email/${verifyToken}`,
    );
    expect(reuseRes.status).toBe(200);
  });

  it("rejects an invalid token with 400", async () => {
    const res = await request(app).post(
      "/api/v1/auth/verify-email/not-a-real-token",
    );
    expect(res.status).toBe(400);
  });

  it("rejects a well-formed but wrong-purpose JWT (e.g. an access token) with 400", async () => {
    const { accessToken } = await registerAndGetToken(
      "verify.wrongpurpose@example.com",
    );

    // An access token is a validly-signed JWT but was never issued with
    // purpose "email_verification" — must be rejected, not accepted just
    // because the signature checks out. This is what the explicit
    // `purpose` check in verifyEmailVerificationToken exists for.
    const res = await request(app).post(
      `/api/v1/auth/verify-email/${accessToken}`,
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/resend-verification", () => {
  it("issues a genuinely new token, different from the registration one", async () => {
    const { accessToken, verifyToken: registrationToken } =
      await registerAndGetToken("resend.test@example.com");
    mockSendEmail.mockClear();

    const res = await request(app)
      .post("/api/v1/auth/resend-verification")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const resendToken = extractToken("verify-email");
    expect(resendToken).not.toBe(registrationToken);

    // And the fresh token actually works.
    const verifyRes = await request(app).post(
      `/api/v1/auth/verify-email/${resendToken}`,
    );
    expect(verifyRes.status).toBe(200);
  });

  it("does NOT invalidate the original link — this is the actual bug we fixed", async () => {
    const { accessToken, verifyToken: registrationToken } =
      await registerAndGetToken("resend.no-clobber@example.com");

    await request(app)
      .post("/api/v1/auth/resend-verification")
      .set("Authorization", `Bearer ${accessToken}`);

    // The ORIGINAL (registration) link must still work after a resend —
    // previously this failed because the DB-stored token got overwritten
    // the moment a resend fired, regardless of the 24h window.
    const res = await request(app).post(
      `/api/v1/auth/verify-email/${registrationToken}`,
    );
    expect(res.status).toBe(200);
  });

  it("rejects resend on an already-verified account with 400", async () => {
    const { accessToken, verifyToken } = await registerAndGetToken(
      "resend.verified@example.com",
    );
    await request(app).post(`/api/v1/auth/verify-email/${verifyToken}`);

    const res = await request(app)
      .post("/api/v1/auth/resend-verification")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(app).post("/api/v1/auth/resend-verification");
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { sendEmail } from "../../src/services/email.service.js";

const app = createApp();
const mockSendEmail = vi.mocked(sendEmail);

function extractToken(urlSegment: string): string {
  const lastCall = mockSendEmail.mock.calls.at(-1);
  const html = lastCall?.[0]?.html ?? "";
  const match = html.match(new RegExp(`${urlSegment}/([a-f0-9]{64})`));
  //   if (!match) throw new Error(`No token found in the last sent email for ${urlSegment}`);
  //   return match[1];

  const token = match?.[1];

  if (!token) {
    throw new Error(`No token found in the last sent email for ${urlSegment}`);
  }

  return token;
}

async function registerAndGetToken(email: string) {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: "StrongPass123!" });
  return {
    accessToken: res.body.data.accessToken as string,
    verifyToken: extractToken("verify-email"), // registration itself sends this one
  };
}

describe("GET /api/v1/auth/verify-email/:token", () => {
  it("verifies the account and rejects reusing the same token", async () => {
    const { verifyToken } = await registerAndGetToken(
      "verify.test@example.com",
    );

    const res = await request(app).get(
      `/api/v1/auth/verify-email/${verifyToken}`,
    );
    expect(res.status).toBe(302); // redirects to CLIENT_URL/login?verified=true

    // Reusing the same token afterward must fail — proves the token was
    // actually consumed, not just that verification worked once.
    const reuseRes = await request(app).get(
      `/api/v1/auth/verify-email/${verifyToken}`,
    );
    expect(reuseRes.status).toBe(400);
  });

  it("rejects an invalid token with 400", async () => {
    const res = await request(app).get(
      "/api/v1/auth/verify-email/not-a-real-token",
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
    const verifyRes = await request(app).get(
      `/api/v1/auth/verify-email/${resendToken}`,
    );
    expect(verifyRes.status).toBe(302);
  });

  it("rejects resend on an already-verified account with 400", async () => {
    const { accessToken, verifyToken } = await registerAndGetToken(
      "resend.verified@example.com",
    );
    await request(app).get(`/api/v1/auth/verify-email/${verifyToken}`);

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

import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { sendEmail } from "../../src/services/email.service.js";
import { uniqueUsername } from "../helpers/testUsers.js";

const app = createApp();
const mockSendEmail = vi.mocked(sendEmail);

// sendEmail is mocked globally in setup.ts, so no real email ever goes out —
// but the mock still records exactly what it was CALLED with. The reset
// link (and its token) live inside that captured HTML, same as they'd live
// in a real inbox. This pulls the token back out, so tests can complete a
// flow that would otherwise only be completable by a human reading email.
function extractToken(urlSegment: string): string {
  const lastCall = mockSendEmail.mock.calls.at(-1);
  const html = lastCall?.[0]?.html ?? "";
  const match = html.match(new RegExp(`${urlSegment}/([a-f0-9]{64})`));
  if (!match)
    throw new Error(`No token found in the last sent email for ${urlSegment}`);

  const token = match?.[1];
  if (!token) {
    throw new Error(`No token found in the last sent email for ${urlSegment}`);
  }

  return token;
}

describe("POST /api/v1/auth/forgot-password", () => {
  it("always returns 200, even for an email that doesn't exist", async () => {
    // Deliberate — this endpoint must never reveal whether an email is
    // registered. A 404 here for unknown emails would let an attacker
    // enumerate real accounts one guess at a time.
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(200);
  });

  it("sends a reset email for a real account", async () => {
    const email = "forgot.test@example.com";
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: "StrongPass123!", username: uniqueUsername() });
    mockSendEmail.mockClear(); // registration also sends an email — ignore that one

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email });

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const sentEmail = mockSendEmail.mock.calls[0]?.[0];

    expect(sentEmail?.to).toBe(email);
  });
});

describe("POST /api/v1/auth/reset-password/:token", () => {
  it("resets the password and invalidates the old one", async () => {
    const email = "reset.test@example.com";
    const oldPassword = "StrongPass123!";
    const newPassword = "NewStrongPass456!";

    await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: oldPassword, username: uniqueUsername() });
    mockSendEmail.mockClear();
    await request(app).post("/api/v1/auth/forgot-password").send({ email });

    const token = extractToken("reset-password");

    const resetRes = await request(app)
      .post(`/api/v1/auth/reset-password/${token}`)
      .send({ newPassword });

    expect(resetRes.status).toBe(200);

    // The actual point: the OLD password must now be rejected...
    const oldLoginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: oldPassword, username: uniqueUsername() });
    expect(oldLoginRes.status).toBe(401);

    // ...and the NEW one must work.
    const newLoginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: newPassword });
    expect(newLoginRes.status).toBe(200);
  });

  it("rejects reusing the same reset token a second time", async () => {
    const email = "reset.reuse@example.com";
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: "StrongPass123!", username: uniqueUsername() });
    mockSendEmail.mockClear();
    await request(app).post("/api/v1/auth/forgot-password").send({ email });

    const token = extractToken("reset-password");

    await request(app)
      .post(`/api/v1/auth/reset-password/${token}`)
      .send({ newPassword: "FirstNewPass123!" });

    const res = await request(app)
      .post(`/api/v1/auth/reset-password/${token}`)
      .send({ newPassword: "SecondNewPass456!" });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid token with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/reset-password/not-a-real-token")
      .send({ newPassword: "SomePass123!" });

    expect(res.status).toBe(400);
  });
});

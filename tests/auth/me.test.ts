import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

const app = createApp();

async function registerAndLogin(email: string) {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: "StrongPass123!" });
  return res.body.data.accessToken as string;
}

describe("GET /api/v1/auth/me", () => {
  it("returns the current user's state for a valid access token", async () => {
    const accessToken = await registerAndLogin("me.endpoint@example.com");

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isProfileComplete).toBe(false);
    expect(res.body.data.hasEmail).toBe(true);
    expect(res.body.data.isVerified).toBe(false);
  });

  it("reflects isProfileComplete: true right after onboarding completes, using the same access token", async () => {
    const accessToken = await registerAndLogin("me.after.onboarding@example.com");

    const onboardingRes = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`);

    // This was previously discarded entirely — if onboarding itself failed
    // for any reason, isProfileComplete staying false below would look
    // like a /me bug when it was actually this call never succeeding.
    expect(
      onboardingRes.status,
      `onboarding POST failed: ${JSON.stringify(onboardingRes.body)}`,
    ).toBe(200);
    expect(onboardingRes.body.data.isProfileComplete).toBe(true);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isProfileComplete).toBe(true);
  });

  it("does not rotate the refresh token or set any cookie", async () => {
    const accessToken = await registerAndLogin("me.no.rotation@example.com");

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("rejects the request when there's no access token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid access token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not-a-real-token");

    expect(res.status).toBe(401);
  });
});
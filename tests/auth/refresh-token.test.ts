import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

const app = createApp();

// JWTs carry `iat` at one-second granularity — two tokens for the same
// payload issued within the same wall-clock second are byte-identical.
// Real clients are naturally spaced out by network/user latency, but these
// tests fire register and refresh back-to-back, so without this delay the
// test can't tell "rotation genuinely happened" apart from "the token just
// happened to match because both calls landed in the same second."
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("POST /api/v1/auth/refresh-token", () => {
  it("issues a new access token and rotates the refresh cookie", async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "refresh.test@example.com", password: "StrongPass123!" });

    const cookie = registerRes.headers["set-cookie"];
    // Asserting this is real, not just casting past the type — if register
    // ever stopped setting a cookie at all, this fails loudly right here
    // with a clear reason, instead of the rest of the test failing
    // downstream with a confusing "cookie was undefined" crash.
    expect(cookie).toBeDefined();

    await wait(1100); // 👈 forces this call into a different second than registration

    const res = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", cookie!); // safe now — the assertion above already proved it's defined

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.accessToken).not.toBe(
      registerRes.body.data.accessToken,
    );

    const newCookie = res.headers["set-cookie"];
    expect(newCookie).toBeDefined();
    expect(newCookie![0]).not.toBe(cookie![0]);
  });

  it("rejects reuse of an already-rotated-out refresh token", async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "refresh.reuse@example.com", password: "StrongPass123!" });

    const originalCookie = registerRes.headers["set-cookie"];
    expect(originalCookie).toBeDefined();

    await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", originalCookie!);

    const res = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", originalCookie!);

    expect(res.status).toBe(401);
  });

  it("rejects a request with no refresh cookie at all", async () => {
    const res = await request(app).post("/api/v1/auth/refresh-token");
    expect(res.status).toBe(401);
  });
});

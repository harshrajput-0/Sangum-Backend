import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { uniqueUsername } from "../helpers/testUsers.js";

const app = createApp();

// Login needs an existing account to log into — unlike register/validation
// tests, every test here depends on one already existing. Rather than
// repeat the same register call in every `it()`, this runs once before
// each test and hands back credentials any test can log in with.
const TEST_EMAIL = "login.test@example.com";
const TEST_PASSWORD = "StrongPass123!";

beforeEach(async () => {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD, username: uniqueUsername() });

  // Fail loudly and immediately if setup itself is broken — otherwise every
  // test in this file quietly runs against an account that was never
  // created, and you get confusing failures in the actual tests instead of
  // a clear signal that the problem is here, in setup.
  if (res.status !== 201) {
    throw new Error(`beforeEach register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();

    // Confirms the refresh cookie carries the path: "/" fix from earlier —
    // without it, this cookie would only be scoped to whatever path set it,
    // and refresh-token would never actually receive it.
    const setCookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(setCookie).toContain("sangum_refresh_token=");
    expect(setCookie).toContain("Path=/");
  });

  it("rejects the wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: "TotallyWrongPassword1" });

    expect(res.status).toBe(401);
  });

  it("rejects a nonexistent email with 401", async () => {
    // Deliberately expects the SAME 401 as a wrong password, not a 404.
    // loginUser uses one generic "Invalid Credentials" message for both
    // cases on purpose — telling an attacker "that email doesn't exist"
    // vs "that password is wrong" leaks which emails are registered at all.
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });

  it("locks the account after 5 failed attempts, even with the right password on the 6th", async () => {
    // Fired one at a time with `await` inside the loop, NOT in parallel
    // (e.g. via Promise.all). Each attempt increments loginAttempts in the
    // database — running them concurrently risks a race where two requests
    // read the same "attempts so far" count before either has saved,
    // undercounting real attempts. Sequential guarantees each one sees the
    // previous one's result, matching what actually happens in production
    // where requests arrive one at a time anyway.
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/v1/auth/login")
        .send({ email: TEST_EMAIL, password: "WrongEveryTime1" });
    }

    // The 6th attempt uses the CORRECT password — this is the actual point
    // of the test. If lockout works, isLocked() should reject this before
    // the password is even checked, regardless of it being right.
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(429);
  });
});
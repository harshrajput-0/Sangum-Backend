import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

const app = createApp();

describe("POST /api/v1/auth/register", () => {
  it("creates a new account", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "new.user@example.com", password: "StrongPass123!" });

    expect(res.status).toBe(201);
    expect(res.body.data.user.hasEmail).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    // the refresh cookie should be set, scoped to the whole app
    const setCookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(setCookie).toContain("sangum_refresh_token=");
    expect(setCookie).toContain("Path=/");
  });

  it("rejects a duplicate email with 409", async () => {
    const email = "dupe@example.com";
    await request(app).post("/api/v1/auth/register").send({ email, password: "StrongPass123!" });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: "StrongPass123!" });

    expect(res.status).toBe(409);
  });

  it("rejects a weak password with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "weak@example.com", password: "weak" });

    expect(res.status).toBe(400);
  });

  it("rejects a malformed email with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "not-an-email", password: "StrongPass123!" });

    expect(res.status).toBe(400);
  });
});
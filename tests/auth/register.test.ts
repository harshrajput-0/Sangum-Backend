import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { uniqueUsername } from "../helpers/testUsers.js";
import Account from "../../src/modules/auth/account.model.js";

const app = createApp();

describe("POST /api/v1/auth/register", () => {
  it("creates a new account", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "new.user@example.com",
      password: "StrongPass123!",
      username: uniqueUsername(),
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.hasEmail).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    // the refresh cookie should be set, scoped to the whole app
    const setCookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(setCookie).toContain("sangum_refresh_token=");
    expect(setCookie).toContain("Path=/");
  });

  it("honors the username the client sent, instead of generating a random one", async () => {
    const username = uniqueUsername("chosen");
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "chose.own.username@example.com",
      password: "StrongPass123!",
      username,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.username).toBe(username.toLowerCase());
  });

  it("rejects a duplicate, already-verified email with 409", async () => {
    const email = "dupe.verified@example.com";
    await request(app).post("/api/v1/auth/register").send({
      email,
      password: "StrongPass123!",
      username: uniqueUsername(),
    });
    await Account.updateOne({ email }, { isVerified: true });

    const res = await request(app).post("/api/v1/auth/register").send({
      email,
      password: "StrongPass123!",
      username: uniqueUsername(),
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBeUndefined();
  });

  it("rejects a duplicate username with 409", async () => {
    const username = uniqueUsername("taken");
    await request(app).post("/api/v1/auth/register").send({
      email: "first.owner@example.com",
      password: "StrongPass123!",
      username,
    });

    const res = await request(app).post("/api/v1/auth/register").send({
      email: "second.claimant@example.com",
      password: "StrongPass123!",
      username, // same username, different email
    });

    expect(res.status).toBe(409);
  });

  it("is case-insensitive on username uniqueness", async () => {
    const username = uniqueUsername("case");
    await request(app).post("/api/v1/auth/register").send({
      email: "casing.first@example.com",
      password: "StrongPass123!",
      username: username.toLowerCase(),
    });

    const res = await request(app).post("/api/v1/auth/register").send({
      email: "casing.second@example.com",
      password: "StrongPass123!",
      username: username.toUpperCase(),
    });

    expect(res.status).toBe(409);
  });

  it("rejects a username with consecutive special characters", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "bad.username@example.com",
      password: "StrongPass123!",
      username: "bad..name",
    });

    expect(res.status).toBe(400);
  });

  it("rejects a username starting or ending with a special character", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "edge.username@example.com",
      password: "StrongPass123!",
      username: "_badname",
    });

    expect(res.status).toBe(400);
  });

  it("rejects a missing username with 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "no.username@example.com",
      password: "StrongPass123!",
    });

    expect(res.status).toBe(400);
  });

  it("rejects a weak password with 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "weak@example.com",
      password: "weak",
      username: uniqueUsername(),
    });

    expect(res.status).toBe(400);
  });

  it("rejects a malformed email with 400", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "not-an-email",
      password: "StrongPass123!",
      username: uniqueUsername(),
    });

    expect(res.status).toBe(400);
  });

  describe("re-registering against an existing unverified account", () => {
    it("resends a verification email and returns ACCOUNT_PENDING_VERIFICATION instead of a hard conflict when the account is <24h old", async () => {
      const email = "pending.recent@example.com";
      await request(app).post("/api/v1/auth/register").send({
        email,
        password: "StrongPass123!",
        username: uniqueUsername(),
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        email,
        password: "StrongPass123!",
        username: uniqueUsername(),
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("ACCOUNT_PENDING_VERIFICATION");
    });

    it("reclaims the email and registers normally when the existing unverified account is older than 24h", async () => {
      const email = "pending.stale@example.com";
      await request(app).post("/api/v1/auth/register").send({
        email,
        password: "StrongPass123!",
        username: uniqueUsername(),
      });
      // Simulate the account having been created >24h ago. Goes through
      // the native driver (Account.collection), not Mongoose's updateOne
      // — the timestamps:true plugin on this schema hooks update queries
      // and was clobbering a Mongoose-level createdAt override back to
      // "now" before the service ever read it.
      await Account.collection.updateOne(
        { email },
        { $set: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } },
      );

      const newUsername = uniqueUsername("reclaimed");
      const res = await request(app).post("/api/v1/auth/register").send({
        email,
        password: "StrongPass123!",
        username: newUsername,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.username).toBe(newUsername.toLowerCase());

      // Only one account should exist for this email — the stale one was
      // deleted, not left behind as an orphan.
      const count = await Account.countDocuments({ email });
      expect(count).toBe(1);
    });
  });
});
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import Account from "../../src/modules/auth/account.model.js";
import { uniqueUsername } from "../helpers/testUsers.js";

const app = createApp();

describe("POST /api/v1/auth/logout", () => {
  it("logs out with a valid token and clears the stored refresh token", async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "logout.test@example.com", password: "StrongPass123!", username: uniqueUsername() });

    const accessToken = registerRes.body.data.accessToken;

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    // Not just "the endpoint returned 200" — actually confirm the side
    // effect happened. Reading the DB directly here, same instinct as
    // checking MongoDB by hand throughout this whole testing pass: a
    // successful-looking response doesn't by itself prove the write occurred.
    const account = await Account.findOne({ email: "logout.test@example.com" }).select(
      "+refreshToken",
    );
    expect(account?.refreshToken).toBeNull();
  });

  it("rejects logout with no token", async () => {
    const res = await request(app).post("/api/v1/auth/logout");
    expect(res.status).toBe(401);
  });

  it("rejects logout with a malformed Authorization header", async () => {
    // Wrong scheme ("Token" instead of "Bearer") — this is the exact case
    // that was silently broken by the "Bearer " trailing-space bug way
    // back in the original audit. This test exists specifically so that
    // bug can never quietly come back without a test catching it.
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "logout.malformed@example.com", password: "StrongPass123!", username: uniqueUsername() });

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Token ${registerRes.body.data.accessToken}`);

    expect(res.status).toBe(401);
  });
});
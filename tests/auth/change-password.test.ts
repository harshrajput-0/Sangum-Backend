import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import axios from "axios";
import { createApp } from "../../src/app.js";
import { uniqueUsername } from "../helpers/testUsers.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const app = createApp();

const TEST_PASSWORD = "StrongPass123!";
const NEW_PASSWORD = "EvenStronger456!";

function getSetCookies(res: request.Response): string[] {
  return (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
}

async function registerAndLogin(email: string) {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: TEST_PASSWORD, username: uniqueUsername() });

  if (res.status !== 201) {
    throw new Error(`registerAndLogin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.data.accessToken as string,
    refreshCookie: getSetCookies(res),
  };
}

// Same CSRF dance required by every OAuth callback test — a real `state`
// has to come from a genuine redirect before the callback accepts it.
async function getRealStateAndCookie() {
  const res = await request(app).get("/api/v1/auth/oauth/google");
  const location = res.headers["location"] as string;
  const state = new URL(location).searchParams.get("state")!;
  return { state, cookie: getSetCookies(res) };
}

describe("POST /api/v1/auth/change-password", () => {
  it("changes the password with the correct current password", async () => {
    const { accessToken } = await registerAndLogin("changepw.happy@example.com");

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(200);

    // Confirm it's actually usable: logging in with the OLD password
    // should now fail, and the NEW one should succeed.
    const oldLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "changepw.happy@example.com", password: TEST_PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "changepw.happy@example.com", password: NEW_PASSWORD });
    expect(newLogin.status).toBe(200);
  });

  it("invalidates the existing refresh token after a successful change", async () => {
    const { accessToken, refreshCookie } = await registerAndLogin(
      "changepw.invalidate@example.com",
    );

    const changeRes = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });
    expect(changeRes.status).toBe(200);

    // The refresh cookie issued at registration should no longer work —
    // a stolen session shouldn't outlive the password that gated it.
    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", refreshCookie);

    expect(refreshRes.status).toBe(401);
  });

  it("rejects an incorrect current password with 401", async () => {
    const { accessToken } = await registerAndLogin("changepw.wrongcurrent@example.com");

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "TotallyWrongPassword1", newPassword: NEW_PASSWORD });

    expect(res.status).toBe(401);
  });

  it("rejects a new password that fails the strength rule with 400", async () => {
    const { accessToken } = await registerAndLogin("changepw.weaknew@example.com");

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: "weak" });

    expect(res.status).toBe(400);
  });

  it("rejects the request when there's no access token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(401);
  });

  it("rejects with 400 for an OAuth-only account that has no password set", async () => {
    const { state, cookie } = await getRealStateAndCookie();

    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-google-token" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-nopassword",
        email: "changepw.oauthonly@example.com",
        name: "OAuth Only",
        picture: "https://example.com/avatar.jpg",
      },
    });

    const callbackRes = await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=fake-code&state=${state}`)
      .set("Cookie", cookie);
    const refreshCookie = getSetCookies(callbackRes);

    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", refreshCookie);
    expect(
      refreshRes.status,
      `refresh after OAuth callback failed: ${JSON.stringify(refreshRes.body)}`,
    ).toBe(200);
    const accessToken = refreshRes.body.data.accessToken as string;

    const res = await request(app)
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "anything-goes-here1", newPassword: NEW_PASSWORD });

    expect(res.status).toBe(400);
  });
});
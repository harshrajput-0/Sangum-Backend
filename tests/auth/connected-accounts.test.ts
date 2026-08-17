import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import axios from "axios";
import { createApp } from "../../src/app.js";
import { uniqueUsername } from "../helpers/testUsers.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const app = createApp();

function getSetCookies(res: request.Response): string[] {
  return (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
}

async function registerAndLogin(email: string) {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: "StrongPass123!", username: uniqueUsername() });

  if (res.status !== 201) {
    throw new Error(`registerAndLogin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body.data.accessToken as string;
}

async function getRealStateAndCookie() {
  const res = await request(app).get("/api/v1/auth/oauth/google");
  const location = res.headers["location"] as string;
  const state = new URL(location).searchParams.get("state")!;
  return { state, cookie: getSetCookies(res) };
}

describe("GET /api/v1/auth/connected-accounts", () => {
  it("returns an empty list for a local-only account", async () => {
    const accessToken = await registerAndLogin("connected.localonly@example.com");

    const res = await request(app)
      .get("/api/v1/auth/connected-accounts")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("includes google after a real OAuth login on that account", async () => {
    const { state, cookie } = await getRealStateAndCookie();

    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-google-token" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-connected",
        email: "connected.google@example.com",
        name: "Connected Google",
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
      .get("/api/v1/auth/connected-accounts")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].provider).toBe("google");
    expect(res.body.data[0].connectedAt).toBeTruthy();
  });

  it("does NOT include a provider the account never linked", async () => {
    // Straightforward but worth covering explicitly: a local-registered
    // account with zero OAuth history should never show github/linkedin
    // just because those AuthProvider enum values exist.
    const accessToken = await registerAndLogin("connected.noleak@example.com");

    const res = await request(app)
      .get("/api/v1/auth/connected-accounts")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const providers = res.body.data.map((p: { provider: string }) => p.provider);
    expect(providers).not.toContain("github");
    expect(providers).not.toContain("google");
    expect(providers).not.toContain("linkedin");
  });

  it("rejects the request when there's no access token", async () => {
    const res = await request(app).get("/api/v1/auth/connected-accounts");
    expect(res.status).toBe(401);
  });
});
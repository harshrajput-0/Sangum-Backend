import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import axios from "axios";
import { createApp } from "../../src/app.js";
import Account from "../../src/modules/auth/account.model.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const app = createApp();

function getSetCookies(res: request.Response): string[] {
  return (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
}

async function getRealStateAndCookie() {
  const res = await request(app).get("/api/v1/auth/oauth/linkedin");
  const location = res.headers["location"] as string;
  const state = new URL(location).searchParams.get("state")!;
  return { state, cookie: getSetCookies(res) };
}

describe("GET /api/v1/auth/oauth/linkedin", () => {
  it("redirects to LinkedIn with a state param and sets the oauth_state cookie", async () => {
    const res = await request(app).get("/api/v1/auth/oauth/linkedin");
    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("linkedin.com/oauth/v2/authorization");
    expect(getSetCookies(res)[0]).toContain("oauth_state=");
  });
});

describe("GET /api/v1/auth/oauth/linkedin/callback", () => {
  it("creates a new account with a verified email", async () => {
    const { state, cookie } = await getRealStateAndCookie();

    // Only two calls here, same shape as Google — token exchange, then
    // userinfo. Unlike GitHub, there's no third "fetch emails separately"
    // call, since LinkedIn's OIDC userinfo endpoint always includes email
    // directly (per this provider's own comment above the implementation).
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "fake-linkedin-token" } });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "linkedin-user-111",
        email: "linkedinuser@example.com",
        name: "LinkedIn User",
        picture: "https://example.com/avatar.jpg",
      },
    });

    const res = await request(app)
      .get(`/api/v1/auth/oauth/linkedin/callback?code=fake-code&state=${state}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(302);
    expect(getSetCookies(res).some((c) => c.includes("sangum_refresh_token="))).toBe(true);

    const account = await Account.findOne({ email: "linkedinuser@example.com" });
    expect(account).toBeTruthy();
    expect(account?.isVerified).toBe(true);
    expect(account?.authProviders[0]?.provider).toBe("linkedin");
  });

  it("logs the returning user into the same account on a second login", async () => {
    let { state, cookie } = await getRealStateAndCookie();
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "token-1" } });
    mockedAxios.get.mockResolvedValueOnce({
      data: { sub: "linkedin-user-222", email: "returning@example.com", name: "Returning", picture: null },
    });
    await request(app)
      .get(`/api/v1/auth/oauth/linkedin/callback?code=code1&state=${state}`)
      .set("Cookie", cookie);

    const firstAccount = await Account.findOne({ email: "returning@example.com" });

    ({ state, cookie } = await getRealStateAndCookie());
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "token-2" } });
    mockedAxios.get.mockResolvedValueOnce({
      data: { sub: "linkedin-user-222", email: "returning@example.com", name: "Returning", picture: null },
    });
    await request(app)
      .get(`/api/v1/auth/oauth/linkedin/callback?code=code2&state=${state}`)
      .set("Cookie", cookie);

    const allMatches = await Account.find({ email: "returning@example.com" });
    expect(allMatches).toHaveLength(1);
    expect(allMatches[0]?._id.toString()).toBe(firstAccount?._id.toString());
  });

  it("links to an existing email/password account instead of duplicating it", async () => {
    const email = "linkedinlink@example.com";
    await request(app).post("/api/v1/auth/register").send({ email, password: "StrongPass123!" });

    const { state, cookie } = await getRealStateAndCookie();
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "token" } });
    mockedAxios.get.mockResolvedValueOnce({
      data: { sub: "linkedin-user-333", email, name: "Link Me", picture: null },
    });

    await request(app)
      .get(`/api/v1/auth/oauth/linkedin/callback?code=code&state=${state}`)
      .set("Cookie", cookie);

    const account = await Account.findOne({ email });
    expect(account?.authProviders).toHaveLength(1);
    expect(account?.authProviders[0]?.provider).toBe("linkedin");

    const allMatches = await Account.find({ email });
    expect(allMatches).toHaveLength(1);
  });

  it("rejects a mismatched state with a redirect to an error, not the app", async () => {
    const { cookie } = await getRealStateAndCookie();
    const res = await request(app)
      .get(`/api/v1/auth/oauth/linkedin/callback?code=fake&state=wrong-state`)
      .set("Cookie", cookie);

    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("error=invalid_state");
  });
});
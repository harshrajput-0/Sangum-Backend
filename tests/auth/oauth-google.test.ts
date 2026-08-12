import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import axios from "axios";
import { createApp } from "../../src/app.js";
import Account from "../../src/modules/auth/account.model.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const app = createApp();

// @types/superagent types every header (including set-cookie) as a plain
// `string`, even though supertest actually returns set-cookie as a real
// string array at runtime whenever a redirect sets one. This documents
// that gap in one place instead of casting it away silently at each call site.
function getSetCookies(res: request.Response): string[] {
  return (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
}

// oauthRedirect issues a real random `state` and sets it as a real cookie.
// oauthCallback then requires the state query param to match that cookie
// exactly (this is the CSRF protection). There's no way to skip straight to
// testing the callback — the state has to come from a genuine redirect call
// first, same as a real browser would experience.
async function getRealStateAndCookie() {
  const res = await request(app).get("/api/v1/auth/oauth/google");
  const location = res.headers["location"] as string;
  const state = new URL(location).searchParams.get("state")!;
  return { state, cookie: getSetCookies(res) };
}

describe("GET /api/v1/auth/oauth/google", () => {
  it("redirects to Google with a state param and sets the oauth_state cookie", async () => {
    const res = await request(app).get("/api/v1/auth/oauth/google");
    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("accounts.google.com");
    expect(getSetCookies(res)[0]).toContain("oauth_state=");
  });
});

describe("GET /api/v1/auth/oauth/google/callback", () => {
  it("creates a new account on first-time login", async () => {
    const { state, cookie } = await getRealStateAndCookie();

    // Two axios calls happen inside fetchGoogleProfile, in order: the code
    // exchange (POST), then the userinfo fetch (GET). mockResolvedValueOnce
    // queues these up so the first call gets the first mock, the second
    // call gets the second — matching the real call order exactly.
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-google-token" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-111",
        email: "googleuser@example.com",
        name: "Google User",
        picture: "https://example.com/avatar.jpg",
      },
    });

    const res = await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=fake-code&state=${state}`)
      .set("Cookie", cookie!);

    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("/oauth/callback");
    expect(
      getSetCookies(res).some((c) => c.includes("sangum_refresh_token=")),
    ).toBe(true);

    const account = await Account.findOne({ email: "googleuser@example.com" });
    expect(account).toBeTruthy();
    // Google's email is trusted as pre-verified — no verification email
    // round-trip needed the way email/password registration requires.
    expect(account?.isVerified).toBe(true);
  });

  it("logs the returning user into the same account on a second login", async () => {
    let { state, cookie } = await getRealStateAndCookie();
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-token-1" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-222",
        email: "returning@example.com",
        name: "Returning User",
        picture: null,
      },
    });
    await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=code1&state=${state}`)
      .set("Cookie", cookie!);

    const firstAccount = await Account.findOne({
      email: "returning@example.com",
    });

    // Same providerId as before — this must hit CASE 1 (returning user) in
    // handleOAuthLogin, not create a second account for the same person.
    ({ state, cookie } = await getRealStateAndCookie());
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-token-2" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-222",
        email: "returning@example.com",
        name: "Returning User",
        picture: null,
      },
    });
    await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=code2&state=${state}`)
      .set("Cookie", cookie!);

    const allMatches = await Account.find({ email: "returning@example.com" });
    expect(allMatches).toHaveLength(1);
    expect(allMatches[0]?._id.toString()).toBe(firstAccount?._id.toString());
  });

  it("links to an existing email/password account instead of duplicating it", async () => {
    // This is the exact permanent regression guard for the addOAuthProvider
    // bug fixed earlier — findById's second argument being treated as a
    // projection instead of an update, silently no-op'ing the link.
    const email = "linkme@example.com";
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: "StrongPass123!" });

    const { state, cookie } = await getRealStateAndCookie();
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-token" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { sub: "google-user-333", email, name: "Link Me", picture: null },
    });

    await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=code&state=${state}`)
      .set("Cookie", cookie!);

    const account = await Account.findOne({ email });
    expect(account?.authProviders).toHaveLength(1);
    expect(account?.authProviders[0]?.provider).toBe("google");

    const allMatches = await Account.find({ email });
    expect(allMatches).toHaveLength(1); // linked, not duplicated
  });

  it("rejects a mismatched state with a redirect to an error, not the app", async () => {
    const { cookie } = await getRealStateAndCookie(); // a real cookie...
    const res = await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=fake&state=wrong-state`) // ...paired with the wrong state
      .set("Cookie", cookie!);

    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("error=invalid_state");
  });
});

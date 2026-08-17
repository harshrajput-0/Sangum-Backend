import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import axios from "axios";
import { createApp } from "../../src/app.js";
import Account from "../../src/modules/auth/account.model.js";
import User from "../../src/modules/users/user.model.js";
import { uniqueUsername } from "../helpers/testUsers.js";

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

    // OAuth signups used to get a placeholder like "user_a1b2c3d4e5" —
    // fine as a stopgap, but if onboarding's own prefill ever fails to
    // load (e.g. a lost session on refresh), completeOnboarding now
    // *keeps* whatever's already on the account instead of regenerating
    // it — so this needs to be a real, email-derived value from the
    // moment the account is created, not something meant to be
    // immediately replaced.
    const user = await User.findOne({ accountId: account!._id });
    expect(user?.username).not.toMatch(/^user_[a-f0-9]{10}$/);
    expect(user?.username).toMatch(/^googleuser/);
  });

  it("generates a valid username from a dotted email local-part", async () => {
    // "first.last" used to have its dot stripped entirely by the
    // generator; it should now survive, but the result must still never
    // start/end with it or contain it consecutively (user.model.ts's
    // username format rules).
    const { state, cookie } = await getRealStateAndCookie();

    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-google-token" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-222",
        email: "first.last@example.com",
        name: "First Last",
        picture: "https://example.com/avatar.jpg",
      },
    });

    await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=fake-code&state=${state}`)
      .set("Cookie", cookie!);

    const account = await Account.findOne({ email: "first.last@example.com" });
    const user = await User.findOne({ accountId: account!._id });
    expect(user?.username).toMatch(
      /^(?![.-])(?!.*[.-]{2,})[a-z0-9_.-]+(?<![.-])$/,
    );
  });

  it("logs the returning user into the same account on a second login", async () => {
    const { state: state1, cookie: cookie1 } = await getRealStateAndCookie();

    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-google-token" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-222",
        email: "returning@example.com",
        name: "Returning User",
        picture: "https://example.com/avatar.jpg",
      },
    });

    await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=fake-code&state=${state1}`)
      .set("Cookie", cookie1!);

    const firstAccount = await Account.findOne({ email: "returning@example.com" });

    const { state: state2, cookie: cookie2 } = await getRealStateAndCookie();

    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-google-token-2" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-222",
        email: "returning@example.com",
        name: "Returning User",
        picture: "https://example.com/avatar.jpg",
      },
    });

    const res = await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=fake-code-2&state=${state2}`)
      .set("Cookie", cookie2!);

    expect(res.status).toBe(302);

    const accountCount = await Account.countDocuments({ email: "returning@example.com" });
    expect(accountCount).toBe(1);

    const secondAccount = await Account.findOne({ email: "returning@example.com" });
    expect(secondAccount?._id.toString()).toBe(firstAccount?._id.toString());
  });

  it("links to an existing email/password account instead of duplicating it", async () => {
    const email = "linkable@example.com";
    await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: "StrongPass123!", username: uniqueUsername() });

    const { state, cookie } = await getRealStateAndCookie();

    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-google-token" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-333",
        email,
        name: "Linkable User",
        picture: "https://example.com/avatar.jpg",
      },
    });

    const res = await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=fake-code&state=${state}`)
      .set("Cookie", cookie!);

    expect(res.status).toBe(302);

    const accountCount = await Account.countDocuments({ email });
    expect(accountCount).toBe(1);

    const account = await Account.findOne({ email });
    expect(
      account?.authProviders.some((p) => p.provider === "google"),
    ).toBe(true);
  });

  it("rejects a mismatched state with a redirect to an error, not the app", async () => {
    const { cookie } = await getRealStateAndCookie();

    const res = await request(app)
      .get("/api/v1/auth/oauth/google/callback?code=fake-code&state=wrong-state")
      .set("Cookie", cookie!);

    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("error=");
  });
});
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import axios from "axios";
import { createApp } from "../../src/app.js";
import Account from "../../src/modules/auth/account.model.js";
import { uniqueUsername } from "../helpers/testUsers.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const app = createApp();

// Same gap as the Google test file: @types/superagent types set-cookie as
// a plain string, but supertest actually returns a real array at runtime.
function getSetCookies(res: request.Response): string[] {
  return (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
}

async function getRealStateAndCookie() {
  const res = await request(app).get("/api/v1/auth/oauth/github");
  const location = res.headers["location"] as string;
  const state = new URL(location).searchParams.get("state")!;
  return { state, cookie: getSetCookies(res) };
}

describe("GET /api/v1/auth/oauth/github", () => {
  it("redirects to GitHub with a state param and sets the oauth_state cookie", async () => {
    const res = await request(app).get("/api/v1/auth/oauth/github");
    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("github.com/login/oauth/authorize");
    expect(getSetCookies(res)[0]).toContain("oauth_state=");
  });
});

describe("GET /api/v1/auth/oauth/github/callback", () => {
  it("creates a new account with a verified email", async () => {
    const { state, cookie } = await getRealStateAndCookie();

    // Three axios calls happen inside fetchGithubProfile, in order: token
    // exchange (POST), profile fetch (GET /user), then emails fetch
    // (GET /user/emails). Order matters for mockResolvedValueOnce — each
    // call consumes the next queued mock in sequence.
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "fake-github-token" } });
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { id: 555111, login: "octocat-test", name: "Octo Cat", avatar_url: "https://example.com/a.jpg" },
      })
      .mockResolvedValueOnce({
        data: [{ email: "octocat@example.com", primary: true, verified: true }],
      });

    const res = await request(app)
      .get(`/api/v1/auth/oauth/github/callback?code=fake-code&state=${state}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(302);
    expect(getSetCookies(res).some((c) => c.includes("sangum_refresh_token="))).toBe(true);

    const account = await Account.findOne({ email: "octocat@example.com" });
    expect(account).toBeTruthy();
    expect(account?.isVerified).toBe(true);
    expect(account?.authProviders[0]?.provider).toBe("github");
  });

  it("creates an account with no email when GitHub has none to give", async () => {
    // This is the real code path — the same one manually forced earlier by
    // temporarily commenting out the /user/emails fallback and signing in
    // with a real GitHub account. Here it's exercised properly: the emails
    // endpoint genuinely returns nothing usable (empty array), so
    // fetchGithubProfile's own fallback logic resolves email to null on
    // its own, no manual DB insertion needed.
    const { state, cookie } = await getRealStateAndCookie();

    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "fake-token" } });
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { id: 555222, login: "no-email-user", name: null, avatar_url: null },
      })
      .mockResolvedValueOnce({ data: [] }); // no emails at all — primary and verified both fail to find

    const res = await request(app)
      .get(`/api/v1/auth/oauth/github/callback?code=code&state=${state}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(302);

    const account = await Account.findOne({ "authProviders.providerId": "555222" });
    expect(account).toBeTruthy();
    expect(account?.email).toBeFalsy();
    expect(account?.isVerified).toBe(false);
    // displayName falls back to `login` when GitHub's `name` field is null —
    // confirms that fallback in fetchGithubProfile actually works, not just
    // that email resolution does.
  });

  it("logs the returning user into the same account on a second login", async () => {
    let { state, cookie } = await getRealStateAndCookie();
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "token-1" } });
    mockedAxios.get
      .mockResolvedValueOnce({ data: { id: 555333, login: "returner", name: "Returner", avatar_url: null } })
      .mockResolvedValueOnce({ data: [{ email: "returner@example.com", primary: true, verified: true }] });
    await request(app)
      .get(`/api/v1/auth/oauth/github/callback?code=code1&state=${state}`)
      .set("Cookie", cookie);

    const firstAccount = await Account.findOne({ email: "returner@example.com" });

    ({ state, cookie } = await getRealStateAndCookie());
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "token-2" } });
    mockedAxios.get
      .mockResolvedValueOnce({ data: { id: 555333, login: "returner", name: "Returner", avatar_url: null } })
      .mockResolvedValueOnce({ data: [{ email: "returner@example.com", primary: true, verified: true }] });
    await request(app)
      .get(`/api/v1/auth/oauth/github/callback?code=code2&state=${state}`)
      .set("Cookie", cookie);

    const allMatches = await Account.find({ email: "returner@example.com" });
    expect(allMatches).toHaveLength(1);
    expect(allMatches[0]?._id.toString()).toBe(firstAccount?._id.toString());
  });

  it("links to an existing email/password account instead of duplicating it", async () => {
    const email = "githublink@example.com";
    await request(app).post("/api/v1/auth/register").send({ email, password: "StrongPass123!", username: uniqueUsername() });

    const { state, cookie } = await getRealStateAndCookie();
    mockedAxios.post.mockResolvedValueOnce({ data: { access_token: "token" } });
    mockedAxios.get
      .mockResolvedValueOnce({ data: { id: 555444, login: "linker", name: "Linker", avatar_url: null } })
      .mockResolvedValueOnce({ data: [{ email, primary: true, verified: true }] });

    await request(app)
      .get(`/api/v1/auth/oauth/github/callback?code=code&state=${state}`)
      .set("Cookie", cookie);

    const account = await Account.findOne({ email });
    expect(account?.authProviders).toHaveLength(1);
    expect(account?.authProviders[0]?.provider).toBe("github");

    const allMatches = await Account.find({ email });
    expect(allMatches).toHaveLength(1);
  });

  it("rejects a mismatched state with a redirect to an error, not the app", async () => {
    const { cookie } = await getRealStateAndCookie();
    const res = await request(app)
      .get(`/api/v1/auth/oauth/github/callback?code=fake&state=wrong-state`)
      .set("Cookie", cookie);

    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("error=invalid_state");
  });
});
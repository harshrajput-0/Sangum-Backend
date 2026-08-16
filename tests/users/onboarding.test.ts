import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import { createApp } from "../../src/app.js";
import User from "../../src/modules/users/user.model.js";
import Account from "../../src/modules/auth/account.model.js";
import { uniqueUsername } from "../helpers/testUsers.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload: vi.fn() },
  },
}));
const mockedUpload = vi.mocked(cloudinary.uploader.upload);

const app = createApp();

function getSetCookies(res: request.Response): string[] {
  return (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
}

async function registerAndLogin(email: string) {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: "StrongPass123!", username: uniqueUsername() });
  return res.body.data.accessToken as string;
}

// Same CSRF dance as the OAuth callback tests: a real state has to come
// from a genuine redirect before the callback will accept it.
async function getRealStateAndCookie() {
  const res = await request(app).get("/api/v1/auth/oauth/google");
  const location = res.headers["location"] as string;
  const state = new URL(location).searchParams.get("state")!;
  return { state, cookie: getSetCookies(res) };
}

describe("POST /api/v1/users/onboarding", () => {
  beforeEach(() => {
    // Without this, a real upload() call recorded in one test (e.g. "uploads
    // the avatar to Cloudinary...") stays in the mock's call history for
    // every test after it, so "...not.toHaveBeenCalled()" assertions can
    // fail on a call that happened in a completely different test.
    mockedUpload.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
  });

  it("completes onboarding with a provided username and fullName", async () => {
    const accessToken = await registerAndLogin("onboard.manual@example.com");

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("username", "cool_uma_99")
      .field("fullName", "Uma Rajput");

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("cool_uma_99");
    expect(res.body.data.displayName).toBe("Uma Rajput");
    expect(res.body.data.isProfileComplete).toBe(true);
    // no file uploaded and nothing pre-seeded -> falls back to a generated identicon
    expect(res.body.data.avatar).toContain("api.dicebear.com");
    expect(res.body.data.avatar).toContain("seed=cool_uma_99");
  });

  it("auto-generates username and displayName when both are omitted", async () => {
    const accessToken = await registerAndLogin("auto.gen@example.com");

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toMatch(
      /^(?![.-])(?!.*[.-]{2,})[a-z0-9_.-]{5,20}(?<![.-])$/,
    );
    // The email's local-part dot ("auto.gen") is now preserved rather than
    // stripped, since dots are allowed mid-username as of the charset change.
    expect(res.body.data.username.startsWith("auto.gen")).toBe(true);
    // fullName wasn't provided either, so it should fall back to the
    // final (generated) username, not stay blank.
    expect(res.body.data.displayName).toBe(res.body.data.username);
  });

  it("treats blank form fields the same as omitted fields", async () => {
    const accessToken = await registerAndLogin("blank.fields@example.com");

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("username", "")
      .field("fullName", "");

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBeTruthy();
    expect(res.body.data.displayName).toBe(res.body.data.username);
  });

  it("rejects a username that's already taken with 409", async () => {
    const tokenA = await registerAndLogin("first.owner@example.com");
    await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${tokenA}`)
      .field("username", "takenname");

    const tokenB = await registerAndLogin("second.owner@example.com");
    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${tokenB}`)
      .field("username", "takenname");

    expect(res.status).toBe(409);
  });

  it("rejects an invalid username format with 400", async () => {
    const accessToken = await registerAndLogin("bad.username@example.com");

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("username", "Not Valid!!");

    expect(res.status).toBe(400);
  });

  it.each([
    ".starts-with-dot",
    "-starts-with-hyphen",
    "ends-with-dot.",
    "ends-with-hyphen-",
    "double..dot",
    "double--hyphen",
    "mixed.-consecutive",
  ])("rejects '%s' as a username with 400", async (badUsername) => {
    const accessToken = await registerAndLogin(
      `bad.charset.${Math.random().toString(36).slice(2)}@example.com`,
    );

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("username", badUsername);

    expect(res.status).toBe(400);
  });

  it("accepts a username with internal dots and hyphens", async () => {
    const accessToken = await registerAndLogin("dot.hyphen.owner@example.com");

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("username", "uma.the-builder");

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("uma.the-builder");
  });

  it("auto-generates a valid username from a dotted email local-part", async () => {
    // "first.last" used to have its dot stripped entirely; now it should
    // survive, but the generated username must still never start/end with
    // it or contain it consecutively.
    const accessToken = await registerAndLogin("first.last@example.com");

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toMatch(
      /^(?![.-])(?!.*[.-]{2,})[a-z0-9_.-]+(?<![.-])$/,
    );
  });

  it("uploads the avatar to Cloudinary when a file is provided", async () => {
    mockedUpload.mockResolvedValueOnce({
      secure_url: "https://res.cloudinary.com/test/avatar123.jpg",
    } as any);

    const accessToken = await registerAndLogin("with.avatar@example.com");

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("username", "avatar_user1")
      .attach("avatar", Buffer.from("fake-image-bytes"), "avatar.jpg");

    expect(res.status).toBe(200);
    expect(res.body.data.avatar).toBe(
      "https://res.cloudinary.com/test/avatar123.jpg",
    );
    expect(mockedUpload).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-image file upload with 400", async () => {
    const accessToken = await registerAndLogin("bad.file@example.com");

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", Buffer.from("not an image"), "notes.txt");

    expect(res.status).toBe(400);
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("rejects completing onboarding a second time with 400", async () => {
    const accessToken = await registerAndLogin("twice@example.com");

    const first = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("username", "shouldnotmatter1");

    expect(second.status).toBe(400);
  });

  it("preserves the OAuth-seeded avatar when no file is uploaded", async () => {
    const { state, cookie } = await getRealStateAndCookie();
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: "fake-google-token" },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        sub: "google-user-avatar-seed",
        email: "oauth.avatar@example.com",
        name: "OAuth Avatar",
        picture: "https://provider.example.com/oauth-avatar.png",
      },
    });

    const callbackRes = await request(app)
      .get(`/api/v1/auth/oauth/google/callback?code=fake-code&state=${state}`)
      .set("Cookie", cookie!);

    // Checkpoint: verify the seed itself landed in the DB, BEFORE onboarding
    // touches anything. If this fails, the bug is in handleOAuthLogin's
    // CASE 3 (new-user creation). If this passes but the final assertion
    // below still shows a generated identicon, the bug is in
    // completeOnboarding's avatar-priority logic instead.
    const seededAccount = await Account.findOne({
      "authProviders.providerId": "google-user-avatar-seed",
    });
    expect(seededAccount, "OAuth account was never created").toBeTruthy();
    const seededUser = await User.findOne({ accountId: seededAccount!._id });
    expect(
      seededUser?.avatar,
      `User.avatar right after OAuth signup was: ${JSON.stringify(seededUser?.avatar)}`,
    ).toBe("https://provider.example.com/oauth-avatar.png");

    const refreshCookie = getSetCookies(callbackRes);

    // Onboarding needs a Bearer access token; the callback only sets the
    // refresh cookie, so exchange it the same way a real client would.
    const refreshRes = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", refreshCookie);
    const accessToken = refreshRes.body.data.accessToken as string;

    const res = await request(app)
      .post("/api/v1/users/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .field("username", "oauth_avatar_user");

    expect(res.status).toBe(200);
    // Should keep the provider's picture, NOT fall back to a generated one.
    expect(res.body.data.avatar).toBe(
      "https://provider.example.com/oauth-avatar.png",
    );
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("rejects the request when there's no access token", async () => {
    const res = await request(app).post("/api/v1/users/onboarding");
    expect(res.status).toBe(401);
  });
});
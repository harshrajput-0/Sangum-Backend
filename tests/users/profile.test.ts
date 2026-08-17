import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { v2 as cloudinary } from "cloudinary";
import { createApp } from "../../src/app.js";
import { uniqueUsername } from "../helpers/testUsers.js";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: { upload: vi.fn() },
  },
}));
const mockedUpload = vi.mocked(cloudinary.uploader.upload);

const app = createApp();

// registration already sets a real, permanent username on the account
// (see auth.services.ts) — no onboarding step is required before a
// profile exists to fetch/update.
async function registerAndLogin(email: string, username?: string) {
  const finalUsername = username ?? uniqueUsername();
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: "StrongPass123!", username: finalUsername });

  if (res.status !== 201) {
    throw new Error(`registerAndLogin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.data.accessToken as string,
    username: finalUsername.toLowerCase(),
  };
}

describe("GET /api/v1/users/:username", () => {
  it("fetches a profile by username with no auth header", async () => {
    const { username } = await registerAndLogin("profile.public@example.com");

    const res = await request(app).get(`/api/v1/users/${username}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(username);
    // Anonymous request — isOwnProfile should be entirely absent, not
    // present-and-false. See toProfileResponse in user.services.ts: the
    // key is only added when a viewer id exists at all.
    expect(res.body.data).not.toHaveProperty("isOwnProfile");
  });

  it("sets isOwnProfile: true when the viewer requests their own profile", async () => {
    const { accessToken, username } = await registerAndLogin("profile.self@example.com");

    const res = await request(app)
      .get(`/api/v1/users/${username}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isOwnProfile).toBe(true);
  });

  it("sets isOwnProfile: false when a different authenticated user views the profile", async () => {
    const { username: viewedUsername } = await registerAndLogin("profile.viewed@example.com");
    const { accessToken: viewerToken } = await registerAndLogin("profile.viewer@example.com");

    const res = await request(app)
      .get(`/api/v1/users/${viewedUsername}`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isOwnProfile).toBe(false);
  });

  it("returns 404 for a username that doesn't exist", async () => {
    const res = await request(app).get("/api/v1/users/nobody-with-this-handle");
    expect(res.status).toBe(404);
  });

  it("still resolves the profile when an invalid/garbage Bearer token is sent", async () => {
    // optionalAuthenticate must swallow a bad token and continue as
    // anonymous, not reject the whole request — this is the route that
    // depends on the "Bearer " trailing-space fix actually working, so
    // covering the failure-tolerant path matters as much as the happy path.
    const { username } = await registerAndLogin("profile.badtoken@example.com");

    const res = await request(app)
      .get(`/api/v1/users/${username}`)
      .set("Authorization", "Bearer not-a-real-token");

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty("isOwnProfile");
  });
});

describe("PATCH /api/v1/users/profile", () => {
  it("updates displayName, bio, and location", async () => {
    const { accessToken } = await registerAndLogin("profile.update@example.com");

    const res = await request(app)
      .patch("/api/v1/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ displayName: "Uma R.", bio: "backend tinkerer", location: "Lucknow" });

    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe("Uma R.");
    expect(res.body.data.bio).toBe("backend tinkerer");
    expect(res.body.data.location).toBe("Lucknow");
  });

  it("persists socialLinks.linkedin — regression test for the socialLinkes typo", async () => {
    // Before this round, updateProfileSchema had a typo'd key
    // ("socialLinkes"), which meant a real socialLinks payload was
    // silently stripped by validation before it ever reached the
    // service layer. This is the case that bug would have hidden.
    const { accessToken } = await registerAndLogin("profile.sociallinks@example.com");

    const res = await request(app)
      .patch("/api/v1/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        socialLinks: {
          linkedin: "https://linkedin.com/in/umarajput",
          github: "https://github.com/umarajput",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.socialLinks.linkedin).toBe("https://linkedin.com/in/umarajput");
    expect(res.body.data.socialLinks.github).toBe("https://github.com/umarajput");
  });

  it("leaves fields not included in the payload untouched", async () => {
    const { accessToken } = await registerAndLogin("profile.partial@example.com");

    const first = await request(app)
      .patch("/api/v1/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bio: "original bio" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .patch("/api/v1/users/profile")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ location: "Delhi" });

    expect(second.status).toBe(200);
    // bio wasn't in this second payload — should still be what it was
    // set to in the first call, not wiped/reset to null.
    expect(second.body.data.bio).toBe("original bio");
    expect(second.body.data.location).toBe("Delhi");
  });

  it("rejects the request when there's no access token", async () => {
    const res = await request(app)
      .patch("/api/v1/users/profile")
      .send({ displayName: "Should Not Work" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/users/profile/avatar", () => {
  beforeEach(() => {
    mockedUpload.mockClear();
  });

  it("uploads a new avatar and returns its url", async () => {
    mockedUpload.mockResolvedValueOnce({
      secure_url: "https://res.cloudinary.com/test/new-avatar.jpg",
    } as any);

    const { accessToken } = await registerAndLogin("avatar.upload@example.com");

    const res = await request(app)
      .post("/api/v1/users/profile/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", Buffer.from("fake-image-bytes"), "avatar.jpg");

    expect(res.status).toBe(200);
    expect(res.body.data.url).toBe("https://res.cloudinary.com/test/new-avatar.jpg");
    expect(mockedUpload).toHaveBeenCalledTimes(1);
  });

  it("rejects the request when no file is attached", async () => {
    const { accessToken } = await registerAndLogin("avatar.nofile@example.com");

    const res = await request(app)
      .post("/api/v1/users/profile/avatar")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("rejects a non-image file with 400", async () => {
    const { accessToken } = await registerAndLogin("avatar.badfile@example.com");

    const res = await request(app)
      .post("/api/v1/users/profile/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", Buffer.from("not an image"), "notes.txt");

    expect(res.status).toBe(400);
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("rejects the request when there's no access token", async () => {
    const res = await request(app)
      .post("/api/v1/users/profile/avatar")
      .attach("avatar", Buffer.from("fake-image-bytes"), "avatar.jpg");

    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/users/profile/cover", () => {
  beforeEach(() => {
    mockedUpload.mockClear();
  });

  it("uploads a new cover image and returns its url", async () => {
    mockedUpload.mockResolvedValueOnce({
      secure_url: "https://res.cloudinary.com/test/new-cover.jpg",
    } as any);

    const { accessToken } = await registerAndLogin("cover.upload@example.com");

    const res = await request(app)
      .post("/api/v1/users/profile/cover")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("cover", Buffer.from("fake-image-bytes"), "cover.jpg");

    expect(res.status).toBe(200);
    expect(res.body.data.url).toBe("https://res.cloudinary.com/test/new-cover.jpg");
    expect(mockedUpload).toHaveBeenCalledTimes(1);
  });

  it("rejects the request when no file is attached", async () => {
    const { accessToken } = await registerAndLogin("cover.nofile@example.com");

    const res = await request(app)
      .post("/api/v1/users/profile/cover")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(400);
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("does not update the avatar field when uploading a cover image", async () => {
    // Regression guard for updateCover writing to the wrong field
    // (banner vs avatar) — the two upload routes share nearly identical
    // controller/service code, differing only in which User field gets
    // the resulting url.
    mockedUpload.mockResolvedValueOnce({
      secure_url: "https://res.cloudinary.com/test/cover-only.jpg",
    } as any);

    const { accessToken, username } = await registerAndLogin("cover.fieldcheck@example.com");

    await request(app)
      .post("/api/v1/users/profile/cover")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("cover", Buffer.from("fake-image-bytes"), "cover.jpg");

    const profileRes = await request(app).get(`/api/v1/users/${username}`);
    expect(profileRes.body.data.banner).toBe("https://res.cloudinary.com/test/cover-only.jpg");
    expect(profileRes.body.data.avatar).not.toBe("https://res.cloudinary.com/test/cover-only.jpg");
  });
});
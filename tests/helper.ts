import request from "supertest";
import { vi } from "vitest";
import type { Express } from "express";
import { sendEmail } from "../src/services/email.service.js";

export const REFRESH_COOKIE_NAME = "sangum_refresh_token";

/**
 * Registers a fresh account and returns everything a subsequent test
 * usually needs: credentials, the access token, and the raw refresh
 * cookie string (so it can be replayed on cookie-reading routes like
 * /refresh-token and /logout).
 */
export async function registerAccount(
  app: Express,
  overrides: { email?: string; password?: string } = {},
) {
  const email = overrides.email ?? `user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = overrides.password ?? "StrongPass123!";

  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password });

  if (res.status !== 201) {
    throw new Error(
      `registerAccount helper failed: expected 201, got ${res.status} — ${JSON.stringify(res.body)}`,
    );
  }

  const setCookie = res.headers["set-cookie"]?.[0] ?? "";
  const refreshCookie = setCookie.split(";")[0]; // "sangum_refresh_token=<value>"

  return {
    email,
    password,
    userId: res.body.data.user.userId as string,
    accessToken: res.body.data.accessToken as string,
    refreshCookie,
  };
}

/**
 * Pulls the most recent verification/reset URL sent for a given email
 * out of the mocked sendEmail's captured calls, by regex-matching the
 * html body. Assumes vi.mock("../src/services/email.service.js", ...)
 * is active (set up in tests/setup.ts).
 */
export function extractLinkFromLastEmail(toEmail: string, urlPattern: RegExp): string {
  const mockedSend = vi.mocked(sendEmail);
  const calls = mockedSend.mock.calls
    .filter(([opts]) => opts.to === toEmail)
    .reverse(); // most recent first

  for (const [opts] of calls) {
    const match = opts.html.match(urlPattern);
    if (match) return match[0];
  }

  throw new Error(`No email to ${toEmail} matched pattern ${urlPattern}`);
}

/** Extracts just the :token param from a captured URL. */
export function extractTokenFromUrl(url: string): string {
  const parts = url.split("/");
  const token = parts[parts.length - 1];
  if (!token) {
    throw new Error(`Could not extract a token from URL: ${url}`);
  }
  return token;
}
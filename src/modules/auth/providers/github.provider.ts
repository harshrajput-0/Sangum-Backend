import axios from "axios";
import { env } from "../../../config/env.js";
import { AuthProvider } from "../account.model.js";
import { OAuthProfile } from "../auth.types.js";



const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/**
 * Step 1 of the OAuth dance: build the URL the frontend redirects the
 * browser to. `state` is a random string the frontend generates and
 * stores (e.g. in sessionStorage) — GitHub returns it unchanged on
 * callback, and we compare it to prevent CSRF.
 */
export const getGithubAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    // THE FIX, part 1 — "user:email" scope is what unlocks the
    // /user/emails endpoint below. Without it, that call returns 404.
    scope: "read:user user:email",
    state,
  });

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
};

/**
 * Step 2: GitHub redirects back to our callback URL with a `code`
 * query param. We exchange that one-time code for an access token.
 */
const exchangeCodeForToken = async (code: string): Promise<string> => {
  const response = await axios.post(
    GITHUB_TOKEN_URL,
    {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    },
    { headers: { Accept: "application/json" } }
  );

  if (!response.data.access_token) {
    throw new Error("GitHub did not return an access token");
  }

  return response.data.access_token;
};

/**
 * Step 3: use the access token to fetch the user's profile AND their
 * email list, then normalize both into the shared OAuthProfile shape
 * that auth.service.ts expects from every provider.
 */
export const fetchGithubProfile = async (code: string): Promise<OAuthProfile> => {
  const accessToken = await exchangeCodeForToken(code);

  const authHeader = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  };

  // Basic profile — id, username, avatar. Its `email` field is
  // UNRELIABLE (often null) — we deliberately ignore it and fetch
  // emails separately below instead.
  const { data: profile } = await axios.get(GITHUB_USER_URL, authHeader);

  // THE FIX, part 2 — the dedicated emails endpoint. Returns an array
  // because GitHub accounts can have multiple verified emails.
  let primaryEmail: string | null = null;

  try {
    const { data: emails } = await axios.get<GithubEmail[]>(GITHUB_EMAILS_URL, authHeader);

    // Prefer the primary + verified email. If for some reason there's
    // no primary flagged, fall back to the first verified one — better
    // than nothing, and still a real address the user controls.
    const primary = emails.find((e) => e.primary && e.verified);
    const anyVerified = emails.find((e) => e.verified);

    primaryEmail = primary?.email ?? anyVerified?.email ?? null;
  } catch {
    // /user/emails call failed entirely — a genuine edge case (network
    // blip, GitHub outage, or a missing scope if someone edited
    // getGithubAuthUrl above and accidentally dropped user:email).
    // This is NOT the expected outcome of a user having their email
    // set to private — that setting doesn't block this call at all.
    // primaryEmail stays null, and auth.service.ts handles this as
    // the "pending email" case.
    primaryEmail = null;
  }

  return {
    provider: AuthProvider.GITHUB,
    providerId: String(profile.id),
    email: primaryEmail,              // <-- may legitimately be null — see auth.service.ts
    displayName: profile.name || profile.login,
    avatar: profile.avatar_url || null,
  };
};

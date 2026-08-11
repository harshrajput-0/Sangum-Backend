import axios from "axios";
import { env } from "../../../config/env.js";
import { AuthProvider } from "../account.model.js";
import { OAuthProfile } from "../auth.types.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * LINKEDIN — ALSO ALWAYS RETURNS EMAIL, BUT NEEDS TWO API CALLS
 * ─────────────────────────────────────────────────────────────────────────
 * LinkedIn's OpenID Connect `userinfo` endpoint (their newer API,
 * "Sign In with LinkedIn using OpenID Connect") returns email directly
 * in one call — similar to Google. No private-email workaround needed
 * here either. Included for completeness since Sangum offers all three.
 * ─────────────────────────────────────────────────────────────────────────
 */

const LINKEDIN_AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export const getLinkedinAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: env.LINKEDIN_CALLBACK_URL,
    response_type: "code",
    scope: "openid profile email",
    state,
  });

  return `${LINKEDIN_AUTHORIZE_URL}?${params.toString()}`;
};

const exchangeCodeForToken = async (code: string): Promise<string> => {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.LINKEDIN_CLIENT_ID,
    client_secret: env.LINKEDIN_CLIENT_SECRET,
    redirect_uri: env.LINKEDIN_CALLBACK_URL,
  });

  const response = await axios.post(LINKEDIN_TOKEN_URL, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data.access_token;
};

export const fetchLinkedinProfile = async (code: string): Promise<OAuthProfile> => {
  const accessToken = await exchangeCodeForToken(code);

  const { data: profile } = await axios.get(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    provider: AuthProvider.LINKEDIN,
    providerId: profile.sub,
    email: profile.email ?? null,
    displayName: profile.name,
    avatar: profile.picture || null,
  };
};

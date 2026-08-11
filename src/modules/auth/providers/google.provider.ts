import axios from "axios";
import { AuthProvider } from "../account.model.js";
import { OAuthProfile } from "../auth.types.js";
import { env } from "../../../config/env.js";


// Goggle URL
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export const getGoogleAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
  });

  return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
};

const exchangeCodeForToken = async (code: string): Promise<string> => {
  const response = await axios.post(GOOGLE_TOKEN_URL, {
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    code,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    grant_type: "authorization_code",
  });

  return response.data.access_token;
};

export const fetchGoogleProfile = async (code: string): Promise<OAuthProfile> => {
  const accessToken = await exchangeCodeForToken(code);

  const { data: profile } = await axios.get(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    provider: AuthProvider.GOOGLE,
    providerId: profile.sub,
    email: profile.email ?? null,   
    displayName: profile.name,
    avatar: profile.picture || null,
  };
};
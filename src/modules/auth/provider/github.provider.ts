import axios from "axios";
import { env } from "../../../config/env.js";
import { AuthProvider } from "../account.model.js";
import { OAuthProfile } from "../auth.types.js";
import { application } from "express";
import ApiError from "../../../utils/ApiError.js";
import { string } from "zod";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

interface IGitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}


// Step 1
export const getGithubAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    
    // "user:email" scope is what unlocks the /user/emails endpoint below. Without it, that call returns 404.
    scope: "read:user user:email",
    state,
  });

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
};


// Step 2 
const exchangeCodeForToken = async (code: string): Promise<string> => {
    const responsse = await axios.post(
        GITHUB_TOKEN_URL, 
        {
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            client_redirect: env.GITHUB_CALLBACK_URL,
        },
        { headers: { Accept: "application/json" }}
    );

    if( !responsse.data.access_token ) {
        throw new Error("Github did not return an access token");
    }

    return responsse.data.access_token;
};


// Step 3
// export const fetchGithubProfile = async (code: string): Promise<OAuthProfile> => {
    // Get accessToken
    // authHeader

    // Get data 

    // primaryEmail

    
    // trycatch 
    // Get emails data 
    // Filter primary + verified email
    // Fallback to verified email
    // storing primaryEmail
    // if error then send null


    // return 
// };

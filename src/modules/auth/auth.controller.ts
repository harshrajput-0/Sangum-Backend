import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";

import * as authService from "./auth.services.js";

import { Request, Response } from "express";
import { env } from "../../config/env.js";
import { clearRefreshToken } from "./auth.repository.js";
import crypto from "crypto";

import {
  getGoogleAuthUrl,
  fetchGoogleProfile,
} from "./providers/google.provider.js";
import {
  getGithubAuthUrl,
  fetchGithubProfile,
} from "./providers/github.provider.js";
import {
  getLinkedinAuthUrl,
  fetchLinkedinProfile,
} from "./providers/linkedin.provider.js";

const REFRESH_COOKIE_NAME = "sangum_refresh_token";

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax", // sent on top-level navigation (needed for OAuth redirects)
    // domain: env.COOKIE_DOMAIN,      //[Backend Domain]
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/", // only sent back to auth routes, not the whole API
  });
};

// ============================================================
// ------------------| LOCAL AUTHENTICAITON |------------------
// ============================================================

export const register = asyncHandler(async (req: Request, res: Response) => {
  // get email and password
  const { email, password } = req.body;

  // Call registerUser funtion in auth.service.ts
  const result = await authService.registerUser(email, password);

  // setCookies using refreshToken
  setRefreshCookie(res, result.refreshToken);

  // return response
  res.status(201).json(
    new ApiResponse(201, "Account created successfully", {
      user: result.user,
      accessToken: result.accessToken,
    }),
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  // Get email and password
  const { email, password } = req.body;

  // Call loginUser funtion in auth.service.ts
  const result = await authService.loginUser(email, password);

  // setCookies using refreshToken
  setRefreshCookie(res, result.refreshToken);

  // return response
  res.status(200).json(
    new ApiResponse(200, "User login successfully", {
      user: result.user,
      accessToken: result.accessToken,
    }),
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // FIX GUARD
  if (!req.user) {
    throw ApiError.unauthorized("Not authenticated");
  }

  // Call logoutUser funtion in auth.service.ts
  await authService.logoutUser(req.user?.userId);

  // clear refreshToken
  await clearRefreshToken(req.user.userId);

  // return response
  res.status(200).json(new ApiResponse(200, "User logout successfully", null));
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    // Get refreshToken
    const token = req.cookies[REFRESH_COOKIE_NAME];

    // Check, if not unauthorized
    if (!token) {
      throw ApiError.unauthorized("No refresh token provided");
    }

    // Call refreshAccessToken funtion in auth.service.ts
    const result = await authService.refreshAccessToken(token);

    // setCookies using refreshToken
    setRefreshCookie(res, result.refreshToken);

    // return response
    res.status(200).json(
      new ApiResponse(200, "Token Refreshed", {
        user: result.user,
        accessToken: result.accessToken,
      }),
    );
  },
);

// ============================================================
// ------------------| FORGET/RESET PASSWORD |-----------------
// ============================================================
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);

    // Always 200, always the same message — see the comment in
    // auth.service.ts forgotPassword() for why (email enumeration).
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "If an account exists with that email, a reset link has been sent",
          null,
        ),
      );
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (typeof token !== "string") {
      res.status(400).json({ message: "Invalid verification token" });
      return;
    }

    await authService.resetPassword(token, newPassword);

    res
      .status(200)
      .json(new ApiResponse(200, "Password reset successfully", null));
  },
);

// ============================================================
// -------------------| EMAIL VERIFICATION |-------------------
// ============================================================
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (typeof token !== "string") {
    res.status(400).json({ message: "Invalid verification token" });
    return;
  }

  await authService.verifyEmail(token);

  // This route is hit by the user clicking a link in their email, so we
  // redirect to the frontend rather than returning raw JSON.
  res.redirect(`${env.CLIENT_URL}/login?verified=true`);
});

export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.resendVerificationEmail(req.user!.userId);

    res.status(200).json(new ApiResponse(200, "Verification email sent", null));
  },
);

/**
 * GET /auth/me  [authenticate]
 *
 * Returns the current user's latest state without changing anything.
 * Uses the same response shape as login, register, and refresh-token.
 * 
 * It is safe to call whenever the frontend already has a valid access token
 * and needs fresh user data—for example, to re-check
 * isProfileComplete, isVerified, or hasEmail after onboarding.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.userId);

  res.status(200).json(new ApiResponse(200, "Current user", user));
});

/**
 * POST /auth/complete-email  [authenticate]
 *
 * The endpoint a pending OAuth account (no email from provider) hits
 * during onboarding. Requires authentication because we need to know
 * WHICH account is completing their email — this is reached only
 * after the user already has a valid access token from the OAuth
 * callback below.
 */
export const completeEmail = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.completeEmail(req.user!.userId, req.body.email);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Email added — check your inbox to verify it",
          null,
        ),
      );
  },
);

// ============================================================
// ------------| OAUTH CONTROLLERS |------------
// ============================================================

type ProviderName = "google" | "github" | "linkedin";

const providerMap: Record<
  ProviderName,
  {
    getAuthUrl: (state: string) => string;
    fetchProfile: (code: string) => Promise<any>;
  }
> = {
  google: { getAuthUrl: getGoogleAuthUrl, fetchProfile: fetchGoogleProfile },
  github: { getAuthUrl: getGithubAuthUrl, fetchProfile: fetchGithubProfile },
  linkedin: {
    getAuthUrl: getLinkedinAuthUrl,
    fetchProfile: fetchLinkedinProfile,
  },
};

export const oauthRedirect = asyncHandler(
  async (req: Request, res: Response) => {
    const provider = req.params.provider as ProviderName; // get provider from param

    // mapprovider -> if not, badrequest (unsupported)
    if (!providerMap[provider]) {
      throw ApiError.badRequest(`Unsupported OAuth Provider: ${provider}`);
    }

    // CSRF protection: random state, stored in a short-lived cookie,
    // compared against what the provider sends back in oauthCallback below.

    // state
    const state = crypto.randomBytes(16).toString("hex");

    // response cookie
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax", // top-level redirect both ways — lax is correct here regardless of cross-site
      maxAge: 5 * 60 * 1000,
    });

    // url
    const url = providerMap[provider].getAuthUrl(state);

    // resposne redirect
    res.redirect(url);
  },
);

/**
 * GET /auth/oauth/:provider/callback
 *
 * Step 2. The provider redirects the browser HERE with ?code=... and
 * ?state=.... We verify state, exchange the code for a profile (this
 * is where github.provider.ts's email-fetching fix actually executes),
 * then hand off to the SAME handleOAuthLogin() used for every provider.
 */
export const oauthCallback = asyncHandler(
  async (req: Request, res: Response) => {
    // provider
    const provider = req.params.provider as ProviderName;

    // deconstruct code and state
    const { code, state } = req.query as { code: string; state: string };

    if (!code) {
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }

    if (!state || state !== req.cookies.oauth_state) {
      return res.redirect(`${env.CLIENT_URL}/login?error=invalid_state`);
    }

    // Clear cookie
    res.clearCookie("oauth_state");

    // Profile and result
    const profile = await providerMap[provider].fetchProfile(code);
    const result = await authService.handleOAuthLogin(profile);

    // console.log("accessToken:", result.accessToken); // 👈 temporary

    // setRefreshCookie
    // console.log("setting refresh cookie, token:", result.refreshToken);
    setRefreshCookie(res, result.refreshToken);

    // response
    res.redirect(`${env.CLIENT_URL}/oauth/callback`);
  },
);

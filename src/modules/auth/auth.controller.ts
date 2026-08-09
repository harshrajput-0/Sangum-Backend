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
} from "./provider/google.provider.js";

const REFRESH_COOKIE_NAME = "sangum_refresh_token";

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",           // sent on top-level navigation (needed for OAuth redirects)
    // domain: env.COOKIE_DOMAIN,      // Backend Domain
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",                    // only sent back to auth routes, not the whole API

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

type ProviderName = "google";

const providerMap: Record<
  ProviderName,
  {
    getAuthUrl: (state: string) => string;
    fetchProfile: (code: string) => Promise<any>;
  }
> = {
  google: { getAuthUrl: getGoogleAuthUrl, fetchProfile: fetchGoogleProfile },
};

export const oauthRedirect = asyncHandler(
  async (req: Request, res: Response) => {
    // get provider from param
    const provider = req.params.provider as ProviderName;

    // mapprovider -> if not, badrequest (unsupported)
    if (!providerMap[provider]) {
      throw ApiError.badRequest(`Unsupported OAuth Provider: ${provider}`);
    }

    // CSRF protection: random state, stored in a short-lived cookie,
    // compared against what the provider sends back in oauthCallback below.

    // state
    const state = crypto.randomBytes(16).toString("hex");

    // response cookie
    res.cookie("oauth_state", state, { httpOnly: true, maxAge: 5 * 60 * 1000 });

    // url
    const url = providerMap[provider].getAuthUrl(state);

    // resposne redirect
    res.redirect(url);
  },
);

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

    // setRefreshCookie
    console.log("setting refresh cookie, token:", result.refreshToken);
setRefreshCookie(res, result.refreshToken);

    // response
    res.redirect(`${env.CLIENT_URL}/oauth/callback`);
  },
);

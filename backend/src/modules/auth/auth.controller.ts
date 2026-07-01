import asyncHandler from "../../utils/asyncHandler";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";

import * as authService from "./auth.services";

import { Request, Response } from "express";
import { env } from "../../config/env";
import { clearRefreshToken } from "./auth.repository";


const REFRESH_COOKIE_NAME = "sangum_refresh_token";

const setRefreshCookie = (res: Response, token: string) => {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};


// ============================================================
// ------------------| LOCAL AUTHENTICAITON |------------------
// ============================================================

export const register = asyncHandler( async (req: Request, res: Response) => {
    // get email and password
    const { email, password } = req.body;

    // Call registerUser funtion in auth.service.ts 
    const result = await authService.registerUser(email, password);

    // setCookies using refreshToken
    setRefreshCookie(res, result.refreshToken);

    // return response
    res.status(201).json(new ApiResponse(201, "Account created successfully", {
        user: result.user,
        accessToken: result.accessToken,
    }));
});

export const login = asyncHandler( async (req: Request, res: Response) => {
    // Get email and password
    const { email, password } = req.body;

    // Call loginUser funtion in auth.service.ts 
    const result = await authService.loginUser(email, password);

    // setCookies using refreshToken
    setRefreshCookie(res, result.refreshToken);

    // return response
    res.status(200).json(new ApiResponse(200, "User login successfully", {
        user: result.user,
        accessToken: result.accessToken
    }))
});

export const logout = asyncHandler( async (req: Request, res: Response) => {
    // FIX GUARD
    if(!req.user){
        throw ApiError.unauthorized("Not authenticated");
    }


    // Call logoutUser funtion in auth.service.ts 
    await authService.logoutUser(req.user?.userId);

    // clear refreshToken
    await clearRefreshToken(req.user.userId);

    // return response
    res.status(200).json(new ApiResponse(200, "User logout successfully", null));
});

export const refreshToken = asyncHandler( async (req: Request, res: Response) => {
    // Get refreshToken
    const token = req.cookies[REFRESH_COOKIE_NAME];

    // Check, if not unauthorized
    if(!token){
        throw ApiError.unauthorized("No refresh token provided");
    }

    // Call refreshAccessToken funtion in auth.service.ts 
    const result = await authService.refreshAccessToken(token);

    // setCookies using refreshToken
    setRefreshCookie(res, token.refreshToken);

    // return response
    res.status(200).json(new ApiResponse(200, "Token Refreshed", {
        user: result.user,
        accessToken: result.accessToken,
    }));
});


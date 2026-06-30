import asyncHandler from "../../utils/asyncHandler";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";

import * as authService from "./auth.services";

import { Request, Response } from "express";
import { IAccount } from "./account.model";
import { IUser } from "../users/user.model";
import { env } from "../../config/env";
import { access } from "node:fs";


const REFRESH_COOKIE_NAME = "sangum_refresh_token";

const setRefreshCookie = (res: Response, token: string) => {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};



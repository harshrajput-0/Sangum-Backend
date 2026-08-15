import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import * as userService from "./user.services.js";
import ApiResponse from "../../utils/ApiResponse.js";


// ============================================================
// -------------------| COMPLETE ONBOARDING |-------------------
// ============================================================
// POST /api/v1/users/onboarding  [authenticate]
//
// Single call at the end of the onboarding wizard (after the user has
// clicked through step 1 — username/fullName — and step 2 — avatar — on
// the frontend). Any field left blank gets an auto-generated default
// server-side; see user.service.ts for the resolution logic.

export const completeOnboarding = asyncHandler(
    async (req: Request, res: Response) => {
        const result = await userService.completeOnboarding(
            req.user!.userId,
            req.body,
            req.file,
        );

        res.status(200).json(new ApiResponse(200, "Onboarding completed", result));
    },
);
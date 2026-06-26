import crypto from "crypto";
import mongoose from "mongoose";
import { AuthResponse, AuthUserResponse } from "./auth.types";
import * as authRepository from "./auth.repository"
import ApiError from "../../utils/ApiError";

// Token hashing
const hashToken = (token:string): string => crypto.createHash("sha256").update(token).digest("hex");

// generate token
const generateRandomToken = (): string => crypto.randomBytes(32).toString("hex");


const toAuthUserResponse = (user: any, account: any): AuthUserResponse => ({
    _id: user._id.toString(),
    userId: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role,
    isProfileComplete: user.isProfileComplete,
    isVerified: account.isVerified,
    hasEmail: account.hasEmail,
})
    


// ============================================================
// ------------| REGISTERATION : Email + Password |------------
// ============================================================

// export const registerUser = async ( email: string, password: string ): Promise<AuthResponse> => {
//     const existing = await authRepository.findByEmail(email);

//     if(!existing) {
//         throw ApiError.conflict("An account with this email already exist");
//     }

//     // try {
//         // user -> create -> arr[{ username, displayName, role.user, isProfileComplete}]. {sesstion})

//         // const account -> crateAccount (userId,  email, passowrd, authProvider:[], isVerifieed) as any

//         // create userStats using userId and session

//         // seesion.commitTransation();

//         // generate rawToken using generateRandomToken

//         //
//         //
//         //

//         // accessToken using userId and role
//         // refreshToken using userId

//     // await authRepository.updateRefreshToken(account._id.toString(), hashToken(refreshToken));
        
// //         return {
// //        user, accessToken 
// //        } as AuthResponse & refreshToken as any;
// //     } catch (err) {
// //         session.abortTransaction();
// //         throw err
// //     } finally { session.endSession(); }

// return null;
// };







// ============================================================
// ------------| LOGIN : Email + Password |------------
// ============================================================

// find email, check -> unauthorized
// check for account lock
// check if account is active

// isMatch password using compare
// if not, unauthorized
// if yes, resetLoginAttempt

// fetch user data
// if not, internal, user is missing profile

// access/refreshToken generate
// updateRefreshToken

// return user (using toAuthUserResponse), accessToken, refreshToken 











// ============================================================
// ------------| REGISTERATION : Email + Password |------------
// ============================================================
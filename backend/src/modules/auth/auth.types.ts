import { UserRole } from "../users/user.model";
import { AuthProvider } from "./account.model";




//===| Response Shape |---------------------------------------------------
export interface AuthUserResponse {
    _id: string,
    userId: string,
    username: string,
    displayName: string,
    avatar: string,
    role: string,
    isProfileComplete: boolean,
    isVerified: boolean,
    hasEmail: boolean,
}
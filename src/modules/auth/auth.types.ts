import { UserRole } from "../users/user.model.js";
import { AuthProvider } from "./account.model.js";
import { AccessTokenPayload } from "../../utils/generateTokens.js"; // adjust path if wrong

//===| Request Payloads |---------------------------------------------------
export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface CompleteEmailPayload {
  email: string;
}

//===| Response Shape |---------------------------------------------------
export interface AuthUserResponse {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  isProfileComplete: boolean;
  isVerified: boolean;
  hasEmail: boolean;
}

export interface AuthResponse {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
}

//===| Express Augmentation |------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

//===| Normalise OAuthResponse |------------------------------------------------
export interface OAuthProfile{
  provider: AuthProvider;
  providerId: string;
  email: string | null;
  displayName: string;
  avatar: string | null;
}
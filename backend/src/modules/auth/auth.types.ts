import { UserRole } from "../users/user.model";
import { AuthProvider } from "./account.model";

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
}

import crypto from "crypto";
import ApiError from "../../utils/ApiError.js";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary.js";
import * as userRepository from "./user.repository.js";
import * as authRespository from "../auth/auth.repository.js";
import { OnboardingPayload, OnboardingResponse } from "./user.types.js";
import { email } from "zod";

// ==============================================================
// -------------------| USERNAME GENERATION |--------------------
// ==============================================================

const sanitizeUsernameBase = (raw: string): string => {
  const cleaned = raw.toLocaleLowerCase().replace(/[^a-z0-9_]/g, "");
  return cleaned.slice(0, 14);
};

const generateUniqueUsername = async (
  email: string,
  excludeUserId?: string,
): Promise<string> => {
  const localPart = email.split("@")[0] ?? "user";
  let base = sanitizeUsernameBase(localPart);

  // A too-short/heavily-stripped local part needs padding
  if (base.length < 3) {
    base = `user${base}`;
  }

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Widen the suffix on repeated collisions rather than looping forever
    // on the same narrow number space.
    const suffixLength = attempt === 0 ? 4 : 6;
    const suffix = crypto
      .randomInt(0, 10 ** suffixLength)
      .toString()
      .padStart(suffixLength, "0");

    let candidate = `${base}${suffix}`;

    if (candidate.length > 20) {
      candidate = `${base.slice(0, 20 - suffix.length)}${suffix}`;
    }
    if (candidate.length < 5) {
      candidate = candidate.padEnd(5, "0");
    }

    const taken = await userRepository.usernameExistsExcludingUser(
      candidate,
      excludeUserId,
    );

    if (!taken) return candidate;
  }

  // Last-resort fallback — same pattern already used at registration time.
  // Collision odds here are negligible enough not to bother re-checking.
  return `user_${crypto.randomBytes(5).toString("hex")}`;
};

// ==============================================================
// --------------------| AVATAR RESOLUTION |---------------------
// ==============================================================
const generateIdentityIconUrl = (seed: string): string =>
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}`;

// ==============================================================
// -------------------| USERNAME GENERATION |--------------------
// ==============================================================

export const completeOnboarding = async (
  userId: string,
  input: OnboardingPayload,
  avatarFile?: Express.Multer.File,
): Promise<OnboardingResponse> => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not Found");
  }

  if (user.isProfileComplete) {
    throw ApiError.badRequest("Onboarding has already has been completed");
  }

  const account = await authRespository.findByUserId(userId);

  if (!account || !account.email) {
    throw ApiError.badRequest(
      "Add an email to your account before completing onboarding",
    );
  }

  // ---| USERNAME |---------------------------------------------------
  let username: string;
  if (input.username) {
    const taken = await userRepository.usernameExistsExcludingUser(
      input.username,
      userId,
    );

    if (taken) {
      throw ApiError.conflict("This username is already taken");
    }
    username = input.username;
  } else {
    username = await generateUniqueUsername(account.email, userId);
  }

  // ---| DISPLAY NAME |-------------------------------------------------
  const displayName = input.fullName || username;

  // ---| AVATAR |---------------------------------------------------------
  // Priority: uploaded file > already-seeded avatar (e.g. OAuth provider
  // picture) > generated identicon.
  let avatar: string | null = user.avatar ?? null;

  if (avatarFile) {
    const uploaded = await uploadToCloudinary(avatarFile.path);

    if (!uploaded) {
        throw ApiError.internal("Failed to upload avatar");
    }
    avatar = uploaded.secure_url;

  }
  else if (!avatar) {
    avatar = generateIdentityIconUrl(username);
  }



  const updated = await userRepository.updateUser(userId, {
    username,
    displayName,
    avatar,
    isProfileComplete: true,
  });

  if (!updated) {
    throw ApiError.internal("Failed to complete onboarding");
  }

  return {
    username: updated.username,
    displayName: updated.displayName,
    avatar: updated.avatar ?? null,
    isProfileComplete: updated.isProfileComplete,
  };
};

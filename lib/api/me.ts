import { api, ApiError } from "./_client";

export interface MyProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    handle: string | null;
    image: string | null;
    role: string;
    /**
     * When this account finished onboarding, ISO 8601, or null.
     *
     * Belongs to the account, not the handset. The app used to keep this in
     * AsyncStorage alone, so the same person was walked through onboarding
     * again on every new device they signed in on.
     */
    onboardedAt: string | null;
    bio: string;
    country: string;
  };
}

export interface UpdateMyProfilePatch {
  name?: string;
  handle?: string;
  bio?: string;
  country?: string;
  /** Only ever true. The server stamps the time and keeps the first one. */
  onboarded?: true;
}

/** GET /api/users/me - joined view of user + profile (bio, country). */
export async function getMyProfile(): Promise<MyProfileResponse["user"] | null> {
  try {
    const res = await api<MyProfileResponse>("/api/users/me");
    return res.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

/** PATCH /api/users/me - update editable profile fields. Returns the refreshed shape. */
export async function updateMyProfile(
  patch: UpdateMyProfilePatch,
): Promise<MyProfileResponse["user"]> {
  const res = await api<MyProfileResponse>("/api/users/me", {
    method: "PATCH",
    body: patch,
  });
  return res.user;
}

/**
 * Record that onboarding is finished, against the account.
 *
 * Best-effort on purpose: the local flag is written either way, so a failed
 * request means this device is fine and a second device asks once more. Losing
 * the round trip must not strand somebody in the onboarding flow.
 */
export async function markOnboarded(): Promise<void> {
  try {
    await updateMyProfile({ onboarded: true });
  } catch {
    /* noop */
  }
}

/**
 * POST /api/auth/change-password - Better-Auth built-in. Requires the current
 * password; revokes other sessions so a leaked password can't keep a session.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api("/api/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword, revokeOtherSessions: true },
  });
}

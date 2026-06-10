import { api, ApiError } from "./_client";

export interface MyProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    handle: string | null;
    image: string | null;
    role: string;
    bio: string;
    country: string;
  };
}

export interface UpdateMyProfilePatch {
  name?: string;
  handle?: string;
  bio?: string;
  country?: string;
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

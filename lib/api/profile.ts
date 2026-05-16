import * as ImagePicker from "expo-image-picker";
import { api, BASE_URL, getToken, ApiError } from "./_client";

export interface PublicProfileClip {
  id: string;
  title: string;
  thumbnailUrl: string;
  durationSec: number;
  viewCount: number;
  createdAt: string;
}

export interface PublicProfileVod {
  id: string;
  title: string;
  thumbnailUrl: string;
  durationSec: number;
  viewCount: number;
  publishedAt: string;
}

export interface PublicProfileChannel {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  category: string;
  isVerified: boolean;
  followerCount: number;
}

export interface PublicProfile {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  country: string;
  joinedAt: string;
  role: string;
  followerCount: number;
  isFollowing: boolean;
  channels: PublicProfileChannel[];
  recentClips: PublicProfileClip[];
  recentVods: PublicProfileVod[];
}

/**
 * Fetch a public profile by handle. Returns null on 404 (handle not found
 * or soft-deleted user). Other failures throw `ApiError`.
 */
export async function getPublicProfileByHandle(
  handle: string,
): Promise<PublicProfile | null> {
  try {
    return await api<PublicProfile>(
      `/api/users/${encodeURIComponent(handle)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export interface UploadAvatarResult {
  ok: true;
  url: string;
}

/** Vercel function body cap is 4.5 MB. Stay safely under with 3.5 MB. */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

/**
 * Pick an image from the device library, upload to the backend's
 * `/api/users/me/avatar` endpoint, and return the public Vercel Blob URL.
 *
 * Throws `Error("permission_denied")` if media-library permission is denied,
 * `Error("cancelled")` if the user backs out, `Error("file_too_large")` if
 * the picker output exceeds the cap (re-pick at lower quality), or
 * `ApiError` for backend failures.
 */
export async function pickAndUploadAvatar(): Promise<UploadAvatarResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("permission_denied");

  // quality: 0.5 + 1:1 crop reliably brings phone photos under 4 MB. The
  // picker may still emit a larger file if the source is HEIC w/ rich
  // metadata; the size check below catches that.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    exif: false,
  });
  if (result.canceled || !result.assets[0]) throw new Error("cancelled");
  const asset = result.assets[0];

  if (asset.fileSize && asset.fileSize > MAX_UPLOAD_BYTES) {
    throw new Error("file_too_large");
  }

  const form = new FormData();
  const filename = asset.uri.split("/").pop() ?? "avatar.jpg";
  const mimeType = asset.mimeType ?? "image/jpeg";

  // RN's FormData accepts {uri,name,type} as the field value for file uploads.
  form.append("file", {
    uri: asset.uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form as unknown as BodyInit,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 413) {
      throw new Error("file_too_large");
    }
    throw new ApiError(res.status, body, `Avatar upload failed (${res.status})`);
  }
  return (await res.json()) as UploadAvatarResult;
}

/**
 * DELETE /api/users/me
 *
 * Self-delete account. Backend sets user.deletedAt + revokes all sessions.
 * After 30 days the gdpr-purge cron anonymizes the row and hard-deletes the
 * user's personal data (watch_events, chats, etc).
 */
export async function deleteOwnAccount(): Promise<{ ok: true; scheduledForIso: string }> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/users/me`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body, `Account deletion failed (${res.status})`);
  }
  const data = (await res.json().catch(() => ({}))) as {
    scheduledForIso?: string;
  };
  // Backend may or may not return a scheduled-for date — synthesize one
  // matching the cron's 30-day purge window.
  const scheduledForIso =
    data.scheduledForIso ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return { ok: true, scheduledForIso };
}

/** DELETE /api/users/me/avatar — revert to default. */
export async function removeAvatar(): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    throw new ApiError(res.status, null, `Avatar delete failed (${res.status})`);
  }
}

import * as ImagePicker from "expo-image-picker";
import { BASE_URL, getToken, ApiError } from "./_client";

export interface UploadAvatarResult {
  ok: true;
  url: string;
}

/**
 * Pick an image from the device library, upload to the backend's
 * `/api/users/me/avatar` endpoint, and return the public Vercel Blob URL.
 *
 * Throws `Error("permission_denied")` if media-library permission is denied,
 * `Error("cancelled")` if the user backs out, or `ApiError` for backend
 * failures (415/413/422 etc).
 */
export async function pickAndUploadAvatar(): Promise<UploadAvatarResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("permission_denied");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) throw new Error("cancelled");
  const asset = result.assets[0];

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
    throw new ApiError(res.status, body, `Avatar upload failed (${res.status})`);
  }
  return (await res.json()) as UploadAvatarResult;
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

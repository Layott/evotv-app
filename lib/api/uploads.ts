import * as ImagePicker from "expo-image-picker";
import { BASE_URL, getToken, ApiError } from "./_client";

/** Vercel function body cap is 4.5 MB. Stay safely under with 3.5 MB. */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

/**
 * Pick an image from the device library and upload it to the backend's
 * admin-only `/api/admin/uploads` endpoint (Vercel Blob, public access).
 *
 * Returns the public blob URL, or null when the user cancels the picker.
 *
 * Throws `Error("permission_denied")` if media-library permission is denied,
 * `Error("file_too_large")` if the picker output exceeds the 3.5 MB cap
 * (re-pick at lower quality), or `ApiError` for backend failures (403 for
 * non-admin callers).
 */
export async function pickAndUploadImage(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("permission_denied");

  // quality: 0.7 keeps covers/creatives sharp while reliably staying under
  // the cap. The size check below catches oversized picker output anyway.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.7,
    exif: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  if (asset.fileSize && asset.fileSize > MAX_UPLOAD_BYTES) {
    throw new Error("file_too_large");
  }

  const form = new FormData();
  const filename = asset.uri.split("/").pop() ?? "upload.jpg";
  const mimeType = asset.mimeType ?? "image/jpeg";

  // RN's FormData accepts {uri,name,type} as the field value for file uploads.
  form.append("file", {
    uri: asset.uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/admin/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form as unknown as BodyInit,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 413) {
      throw new Error("file_too_large");
    }
    throw new ApiError(res.status, body, `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/**
 * Map pickAndUploadImage failures to a human-readable toast message.
 * Shared by the admin content + ads managers.
 */
export function uploadErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "permission_denied") {
    return "Photo library permission denied. Enable it in system settings.";
  }
  if (msg === "file_too_large") {
    return "Image too large. Max 3.5 MB.";
  }
  if (err instanceof ApiError && err.status === 403) {
    return "Admin access required to upload.";
  }
  return "Upload failed. Check your connection and try again.";
}

import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { BASE_URL, getToken, ApiError } from "./_client";

/**
 * Cap for the multipart image route, which does pass through the API process.
 * Inherited from Vercel's 4.5 MB serverless body limit; the droplet has no such
 * limit, but a smaller image is the right answer for this audience anyway.
 */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

/** Client-upload cap. Mirrors MAX_BYTES in /api/admin/uploads/client. */
const MAX_VIDEO_BYTES = 512 * 1024 * 1024;

/**
 * The token route (app/api/admin/uploads/client/route.ts on the backend)
 * rejects any pathname outside this namespace.
 */
const CLIENT_UPLOAD_PREFIX = "admin-uploads/";

const VIDEO_MIME_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

const ALLOWED_VIDEO_MIMES = new Set(Object.values(VIDEO_MIME_BY_EXT));

/**
 * Pick an image from the device library and upload it to the backend's
 * admin-only `/api/admin/uploads` endpoint.
 *
 * Returns the public URL, or null when the user cancels the picker.
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
 * Direct-upload credential for DO Spaces: PUT the bytes at `uploadUrl` with
 * exactly `headers`, and the final URL is `publicUrl` (S3 answers with an empty
 * body, so there is nothing to parse out of the response).
 */
type DirectUpload = {
  uploadUrl: string;
  publicUrl: string;
  headers: Record<string, string>;
};

/**
 * Ask the backend for a direct-upload credential.
 *
 * One round trip: `pathname` + `contentType` in, a presigned PUT back.
 *
 * Server-side constraints (allowed content types, 512 MB cap, `admin-uploads/`
 * prefix, random suffix) are applied when the credential is minted, so the
 * client cannot widen them.
 */
async function requestDirectUpload(
  pathname: string,
  contentType: string,
): Promise<DirectUpload> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/admin/uploads/client`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ pathname, contentType }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body, `Token exchange failed (${res.status})`);
  }
  const data = (await res.json()) as {
    uploadUrl?: string;
    publicUrl?: string;
    headers?: Record<string, string>;
  };

  if (!data.uploadUrl || !data.publicUrl) throw new Error("token_exchange_failed");
  return {
    uploadUrl: data.uploadUrl,
    publicUrl: data.publicUrl,
    headers: data.headers ?? { "Content-Type": contentType },
  };
}

/**
 * PUT the file bytes at a presigned S3 URL.
 *
 * No Authorization header: the signature lives in the query string, and adding
 * one makes S3 reject the request. Headers must match what was signed exactly.
 * Native uses FileSystem.uploadAsync because RN fetch cannot stream a file
 * body; web fetches the picker's blob: URI into a Blob.
 */
async function putFileToPresignedUrl(
  fileUri: string,
  upload: DirectUpload,
): Promise<string> {
  if (Platform.OS === "web") {
    const fileBlob = await (await fetch(fileUri)).blob();
    const res = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: upload.headers,
      body: fileBlob,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => null);
      throw new ApiError(res.status, body, `Upload failed (${res.status})`);
    }
    return upload.publicUrl;
  }

  const result = await FileSystem.uploadAsync(upload.uploadUrl, fileUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: upload.headers,
  });
  if (result.status < 200 || result.status >= 300) {
    // S3 errors are XML, not JSON, so keep the raw body for the message.
    throw new ApiError(result.status, result.body, `Upload failed (${result.status})`);
  }
  return upload.publicUrl;
}

/**
 * Pick a video from the device library and upload it straight to storage with
 * a presigned PUT from the backend's `/api/admin/uploads/client`, so the bytes
 * never pass through the API process. Up to 512 MB.
 *
 * Returns `{ url, durationSec }` (duration from the picker, ms rounded to
 * seconds, null when the platform doesn't report it), or null when the user
 * cancels.
 *
 * Throws `Error("permission_denied")`, `Error("video_too_large")` (over
 * 512 MB), `Error("unsupported_video_type")` (not mp4/mov/webm), or
 * `ApiError` for token-exchange or upload failures.
 */
export async function pickAndUploadVideo(): Promise<{
  url: string;
  durationSec: number | null;
} | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("permission_denied");

  // SDK 52 picker (expo-image-picker 16.x): the array MediaType form replaces
  // the deprecated MediaTypeOptions enum.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
    throw new Error("video_too_large");
  }

  const rawName = asset.fileName ?? asset.uri.split("/").pop() ?? "upload.mp4";
  const filename = rawName.replace(/[^\w.-]+/g, "_");
  const ext = filename.includes(".")
    ? (filename.split(".").pop() ?? "").toLowerCase()
    : "";
  const mimeType =
    asset.mimeType && ALLOWED_VIDEO_MIMES.has(asset.mimeType)
      ? asset.mimeType
      : VIDEO_MIME_BY_EXT[ext];
  if (!mimeType) {
    // Neither the reported mime nor the extension maps to mp4/mov/webm, and
    // the presign would refuse the type anyway, so fail with a clear error.
    throw new Error("unsupported_video_type");
  }

  // Server enforces this prefix and appends a random suffix (no collisions).
  const pathname = `${CLIENT_UPLOAD_PREFIX}${filename}`;

  const upload = await requestDirectUpload(pathname, mimeType);
  const url = await putFileToPresignedUrl(asset.uri, upload);

  // ImagePickerAsset.duration is milliseconds (null for non-videos).
  const durationSec =
    typeof asset.duration === "number" && asset.duration > 0
      ? Math.round(asset.duration / 1000)
      : null;

  return { url, durationSec };
}

/**
 * Map pickAndUploadImage / pickAndUploadVideo failures to a human-readable
 * toast message. Shared by the admin content, ads, vods + streams managers.
 */
export function uploadErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "permission_denied") {
    return "Photo library permission denied. Enable it in system settings.";
  }
  if (msg === "file_too_large") {
    return "Image too large. Max 3.5 MB.";
  }
  if (msg === "video_too_large") {
    return "Video too large. Max 512 MB.";
  }
  if (msg === "unsupported_video_type") {
    return "Unsupported video format. Use MP4, MOV or WebM.";
  }
  if (msg === "token_exchange_failed") {
    return "Upload authorization failed. Try again.";
  }
  if (err instanceof ApiError && err.status === 403) {
    return "Admin access required to upload.";
  }
  return "Upload failed. Check your connection and try again.";
}

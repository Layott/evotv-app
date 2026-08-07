import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { BASE_URL, getToken, ApiError } from "./_client";

/** Vercel function body cap is 4.5 MB. Stay safely under with 3.5 MB. */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

/** Client-upload cap. Mirrors MAX_BYTES in /api/admin/uploads/client. */
const MAX_VIDEO_BYTES = 512 * 1024 * 1024;

/**
 * Vercel Blob public API. Same default the @vercel/blob SDK targets
 * (`defaultVercelBlobApiUrl` in @vercel/blob/dist/chunk-*.js).
 */
const BLOB_API_URL = "https://vercel.com/api/blob";

/** Mirrors BLOB_API_VERSION in @vercel/blob 2.3.3 (installed on the backend). */
const BLOB_API_VERSION = "12";

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
 * Direct-upload credential, whichever backend the API is running.
 *
 * - `presigned`: DO Spaces. PUT the bytes at `uploadUrl` with exactly
 *   `headers`, and the final URL is `publicUrl` (S3 answers with an empty
 *   body, so there is nothing to parse out of the response).
 * - `blob`: legacy Vercel Blob. PUT via the Blob API with a client token and
 *   read the URL back out of the JSON response.
 */
type DirectUpload =
  | { kind: "presigned"; uploadUrl: string; publicUrl: string; headers: Record<string, string> }
  | { kind: "blob"; clientToken: string };

/**
 * Ask the backend for a direct-upload credential.
 *
 * The request body carries both shapes at once: `pathname` + `contentType`
 * for the Spaces branch, and the `blob.generate-client-token` event for the
 * Blob branch. The server reads whichever it needs, so this is one round trip
 * either way and the client does not need to know which store is live.
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
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname, clientPayload: null, multipart: false },
      pathname,
      contentType,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body, `Token exchange failed (${res.status})`);
  }
  const data = (await res.json()) as {
    type?: string;
    uploadUrl?: string;
    publicUrl?: string;
    headers?: Record<string, string>;
    clientToken?: string;
  };

  if (data.type === "presigned-put") {
    if (!data.uploadUrl || !data.publicUrl) throw new Error("token_exchange_failed");
    return {
      kind: "presigned",
      uploadUrl: data.uploadUrl,
      publicUrl: data.publicUrl,
      headers: data.headers ?? { "Content-Type": contentType },
    };
  }

  if (!data.clientToken) throw new Error("token_exchange_failed");
  return { kind: "blob", clientToken: data.clientToken };
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
  upload: Extract<DirectUpload, { kind: "presigned" }>,
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
 * PUT the file bytes straight to the Vercel Blob API with a client token.
 *
 * Replicates the `put` leg of @vercel/blob/client `upload()`:
 * `PUT {BLOB_API_URL}/?pathname=...` with `authorization: Bearer <clientToken>`,
 * `x-api-version`, `x-vercel-blob-access: public` and `x-content-type` headers,
 * raw bytes as the body. Native uses FileSystem.uploadAsync because RN fetch
 * cannot stream a file body; web fetches the picker's blob: URI into a Blob.
 *
 * Returns the public blob URL from the API response.
 */
async function putFileToBlobApi(
  fileUri: string,
  pathname: string,
  mimeType: string,
  clientToken: string,
): Promise<string> {
  const putUrl = `${BLOB_API_URL}/?pathname=${encodeURIComponent(pathname)}`;
  const headers: Record<string, string> = {
    authorization: `Bearer ${clientToken}`,
    "x-api-version": BLOB_API_VERSION,
    "x-vercel-blob-access": "public",
    "x-content-type": mimeType,
  };

  if (Platform.OS === "web") {
    const fileBlob = await (await fetch(fileUri)).blob();
    const res = await fetch(putUrl, { method: "PUT", headers, body: fileBlob });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(res.status, body, `Blob upload failed (${res.status})`);
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  }

  const result = await FileSystem.uploadAsync(putUrl, fileUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers,
  });
  if (result.status < 200 || result.status >= 300) {
    let body: unknown = result.body;
    try {
      body = JSON.parse(result.body);
    } catch {
      /* keep raw text */
    }
    throw new ApiError(result.status, body, `Blob upload failed (${result.status})`);
  }
  const data = JSON.parse(result.body) as { url: string };
  return data.url;
}

/**
 * Pick a video from the device library and client-upload it to Vercel Blob
 * via the backend's `/api/admin/uploads/client` token exchange (bypasses the
 * 4.5 MB serverless body cap; the token allows up to 512 MB).
 *
 * Returns `{ url, durationSec }` (duration from the picker, ms rounded to
 * seconds, null when the platform doesn't report it), or null when the user
 * cancels.
 *
 * Throws `Error("permission_denied")`, `Error("video_too_large")` (over
 * 512 MB), `Error("unsupported_video_type")` (not mp4/mov/webm), or
 * `ApiError` for token-exchange / Blob API failures.
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
    // Neither the reported mime nor the extension maps to mp4/mov/webm; the
    // Blob token would reject the PUT anyway, so fail with a clear error.
    throw new Error("unsupported_video_type");
  }

  // Server enforces this prefix and appends a random suffix (no collisions).
  const pathname = `${CLIENT_UPLOAD_PREFIX}${filename}`;

  const upload = await requestDirectUpload(pathname, mimeType);
  const url =
    upload.kind === "presigned"
      ? await putFileToPresignedUrl(asset.uri, upload)
      : await putFileToBlobApi(asset.uri, pathname, mimeType, upload.clientToken);

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

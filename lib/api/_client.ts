import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3060";

/**
 * Token storage key. MUST match expo-secure-store's allowed character set
 * (`[A-Za-z0-9._-]+`). Colons are REJECTED by SecureStore on iOS/Android —
 * earlier `"evotv:session-token"` silently failed every write, so sessions
 * didn't survive app close. Fixed by using underscores.
 */
const TOKEN_KEY = "evotv_session_token";
const LEGACY_TOKEN_KEY = "evotv:session-token"; // web localStorage migration

/**
 * Token storage.
 *
 * Native: expo-secure-store (Keychain / Keystore).
 * Web: localStorage. NOTE — insecure. Real prod web should swap to httpOnly
 * cookies via fetch credentials: "include" + a separate auth flow that does
 * not round-trip a bearer through JS.
 */
async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      const fresh = globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
      if (fresh) return fresh;
      // Migrate from the legacy colon-keyed value if present.
      const legacy = globalThis.localStorage?.getItem(LEGACY_TOKEN_KEY) ?? null;
      if (legacy) {
        try {
          globalThis.localStorage?.setItem(TOKEN_KEY, legacy);
          globalThis.localStorage?.removeItem(LEGACY_TOKEN_KEY);
        } catch {
          /* noop */
        }
      }
      return legacy;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    if (__DEV__) {
      console.warn("[auth] SecureStore.getItem failed", err);
    }
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (token) globalThis.localStorage?.setItem(TOKEN_KEY, token);
      else {
        globalThis.localStorage?.removeItem(TOKEN_KEY);
        globalThis.localStorage?.removeItem(LEGACY_TOKEN_KEY);
      }
    } catch {
      /* noop */
    }
    return;
  }
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    if (__DEV__) {
      console.warn("[auth] SecureStore.setItem failed", err);
    }
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API ${status}`);
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function api<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: Platform.OS === "web" ? "include" : "omit",
  });

  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

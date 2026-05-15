import { api } from "./_client";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface CreateApiKeyResult {
  id: string;
  name: string;
  prefix: string;
  /** Plaintext — returned ONCE on create. Save it immediately. */
  key: string;
}

export function listMyApiKeys(): Promise<ApiKeyRow[]> {
  return api<ApiKeyRow[]>("/api/account/api-keys");
}

export function createApiKey(name: string): Promise<CreateApiKeyResult> {
  return api<CreateApiKeyResult>("/api/account/api-keys", {
    method: "POST",
    body: { name },
  });
}

export function revokeApiKey(id: string): Promise<{ ok: true }> {
  return api(`/api/account/api-keys/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

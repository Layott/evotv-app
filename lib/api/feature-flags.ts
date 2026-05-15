import { api } from "./_client";

export interface PublicFlag {
  enabled: boolean;
  message?: string;
}

export interface PublicFlags {
  "maintenance.enabled"?: PublicFlag;
  "takedown.enabled"?: PublicFlag;
}

export function getPublicFlags(): Promise<PublicFlags> {
  return api<PublicFlags>("/api/feature-flags/public");
}

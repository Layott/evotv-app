import { api, ApiError } from "./_client";

export type ApplicationStatus =
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected";

export type SocialPlatform =
  | "youtube"
  | "twitch"
  | "tiktok"
  | "kick"
  | "other";

export interface CreatorApplication {
  id: string;
  userId: string;
  bio: string;
  country: string;
  primaryGameId: string;
  socialPlatform: SocialPlatform;
  socialHandle: string;
  followerCount: number;
  agreementAccepted: boolean;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewerNote: string | null;
}

export interface SubmitApplicationPayload {
  bio: string;
  country: string;
  primaryGameId: string;
  socialPlatform: SocialPlatform;
  socialHandle: string;
  followerCount: number;
  agreementAccepted: boolean;
}

/** POST /api/creator-program/apply */
export function submitApplication(
  payload: SubmitApplicationPayload,
): Promise<CreatorApplication> {
  return api<CreatorApplication>("/api/creator-program/apply", {
    method: "POST",
    body: payload,
  });
}

/** GET /api/creator-program/me — null if user never applied. */
export async function getMyApplication(): Promise<CreatorApplication | null> {
  try {
    return await api<CreatorApplication | null>("/api/creator-program/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

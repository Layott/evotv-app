import * as React from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import type { Profile, Role } from "@/lib/types";
import { api, ApiError, setToken } from "@/lib/api/_client";
import { getMyMemberships, type PublisherMembership } from "@/lib/api/partner";
import { persist } from "@/lib/storage/persist";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3060";
const OAUTH_REDIRECT = "evotv://oauth";

/**
 * Real auth provider — Better-Auth bearer flow against the EVO TV backend.
 *
 * Wire order in components/providers/index.tsx:
 *   ThemeProvider → QueryProvider → AuthProvider → children + Toaster + RoleSwitcher
 *
 * Auth flow:
 *   1. signUp / signIn → POST /api/auth/{sign-up,sign-in}/email
 *      response shape: { token: string, user: { id, email, name, role, handle, ... } }
 *   2. Token persisted via _client.setToken() → expo-secure-store on native,
 *      localStorage on web.
 *   3. Subsequent api() calls attach `Authorization: Bearer <token>` automatically.
 *   4. Boot hydration: try GET /api/auth/get-session with stored token. 200 +
 *      non-null body = logged in. Otherwise guest.
 */

type FollowTarget = "team" | "player" | "streamer";

interface BackendUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role?: string;
  handle?: string | null;
  createdAt: string;
  emailVerified: boolean;
}

interface SessionResponse {
  session: { token: string; userId: string; expiresAt: string } | null;
  user: BackendUser | null;
}

interface SignInResponse {
  token: string;
  user: BackendUser;
}

interface AuthContextValue {
  user: Profile | null;
  /** Sign-in email from Better-Auth session. Not part of Profile because
   *  profiles are public-facing; email is account-only. */
  accountEmail: string | null;
  role: Role;
  isLoading: boolean;
  isAuthenticated: boolean;
  publisherMemberships: PublisherMembership[];
  refreshMemberships: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signInWithSocial: (provider: "google" | "apple") => Promise<void>;
  signOut: () => Promise<void>;
  toggleFollow: (targetType: FollowTarget, targetId: string) => void;
  isFollowing: (targetType: FollowTarget, targetId: string) => boolean;
  /** All current follow keys as `{type, id}` pairs (read-only snapshot). */
  followsList: { type: FollowTarget; id: string }[];
  updateProfile: (patch: Partial<Profile>) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  /* ── Backward-compat aliases for screens still on the MockAuth shape ── */
  /** Legacy mock entry point. If first arg is a Role string, no-ops with a
   *  warn (screens must migrate to email+password). If email + password,
   *  routes to real signIn. */
  login: (roleOrEmail: Role | string, password?: string) => void | Promise<void>;
  /** Legacy. Aliased to signOut. */
  logout: () => void | Promise<void>;
  /** Legacy. No-op on real auth (roles come from the server). */
  switchRole: (role: Role) => void;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  handle: string;
}

const FOLLOWS_KEY = "evotv:follows";
const ONBOARD_KEY = "evotv:onboarded";

const AuthContext = React.createContext<AuthContextValue | null>(null);

function toProfile(u: BackendUser): Profile {
  return {
    id: u.id,
    handle: u.handle ?? u.email.split("@")[0] ?? "user",
    displayName: u.name || u.email,
    avatarUrl: u.image ?? "",
    bio: "",
    role: (u.role as Role) ?? "user",
    country: "NG",
    onboardedAt: null,
    createdAt: u.createdAt,
  };
}

function roleOf(profile: Profile | null): Role {
  return profile?.role ?? "guest";
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<Profile | null>(null);
  const [accountEmail, setAccountEmail] = React.useState<string | null>(null);
  const [follows, setFollows] = React.useState<Set<string>>(new Set());
  const [onboardingComplete, setOnboardingComplete] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [publisherMemberships, setPublisherMemberships] = React.useState<
    PublisherMembership[]
  >([]);

  const refreshMemberships = React.useCallback(async () => {
    try {
      const memberships = await getMyMemberships();
      setPublisherMemberships(memberships);
    } catch {
      setPublisherMemberships([]);
    }
  }, []);

  // Hydrate session from stored token on mount.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        try {
          const session = await api<SessionResponse>("/api/auth/get-session");
          if (cancelled) return;
          if (session?.user) {
            setUser(toProfile(session.user));
            setAccountEmail(session.user.email);
            const memberships = await getMyMemberships();
            if (!cancelled) setPublisherMemberships(memberships);
          }
        } catch {
          // No valid session — stay guest.
        }
        const followsList = await persist.get<string[]>(FOLLOWS_KEY);
        const onboarded = await persist.get<boolean>(ONBOARD_KEY);
        if (cancelled) return;
        if (Array.isArray(followsList)) setFollows(new Set(followsList));
        if (onboarded === true) setOnboardingComplete(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const res = await api<SignInResponse>("/api/auth/sign-in/email", {
      method: "POST",
      body: { email, password },
    });
    await setToken(res.token);
    setUser(toProfile(res.user));
    setAccountEmail(res.user.email);
    await refreshMemberships();
  }, [refreshMemberships]);

  const signUp = React.useCallback(async (input: SignUpInput) => {
    const res = await api<SignInResponse>("/api/auth/sign-up/email", {
      method: "POST",
      body: input,
    });
    await setToken(res.token);
    setUser(toProfile(res.user));
    setAccountEmail(res.user.email);
    await refreshMemberships();
  }, [refreshMemberships]);

  /**
   * Open the backend's mobile-auth start endpoint in an in-app browser, wait for
   * the provider to redirect to `evotv://oauth#token=<bearer>`, then hydrate
   * the bearer + session. Web target is unsupported (cookie-based session flow
   * for browsers can be added later).
   */
  const signInWithSocial = React.useCallback(
    async (provider: "google" | "apple") => {
      if (Platform.OS === "web") {
        throw new Error("social_unsupported_web");
      }
      const startURL = `${BASE_URL}/api/mobile-auth/start?provider=${provider}`;
      const result = await WebBrowser.openAuthSessionAsync(
        startURL,
        OAUTH_REDIRECT,
      );
      if (result.type !== "success") {
        if (result.type === "cancel" || result.type === "dismiss") {
          throw new Error("oauth_cancelled");
        }
        throw new Error("oauth_failed");
      }
      const url = result.url;
      const fragment = url.includes("#") ? url.split("#")[1] : "";
      const params = new URLSearchParams(fragment);
      const token = params.get("token");
      const error = params.get("error");
      if (error || !token) throw new Error(error ?? "oauth_no_token");
      await setToken(decodeURIComponent(token));
      const session = await api<SessionResponse>("/api/auth/get-session");
      if (!session?.user) {
        await setToken(null);
        throw new Error("session_load_failed");
      }
      setUser(toProfile(session.user));
      setAccountEmail(session.user.email);
      await refreshMemberships();
    },
    [refreshMemberships],
  );

  const signOut = React.useCallback(async () => {
    try {
      await api("/api/auth/sign-out", { method: "POST" });
    } catch (err) {
      // Network failure shouldn't trap user in signed-in state.
      if (!(err instanceof ApiError)) console.warn("sign-out failed", err);
    }
    await setToken(null);
    setUser(null);
    setAccountEmail(null);
    setPublisherMemberships([]);
  }, []);

  const toggleFollow = React.useCallback((targetType: FollowTarget, targetId: string) => {
    const key = `${targetType}:${targetId}`;
    setFollows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      void persist.set<string[]>(FOLLOWS_KEY, [...next]);
      return next;
    });
  }, []);

  const isFollowing = React.useCallback(
    (targetType: FollowTarget, targetId: string) => {
      return follows.has(`${targetType}:${targetId}`);
    },
    [follows],
  );

  const followsList = React.useMemo<{ type: FollowTarget; id: string }[]>(
    () =>
      Array.from(follows).flatMap((key) => {
        const [type, id] = key.split(":");
        if (!type || !id) return [];
        if (type !== "team" && type !== "player" && type !== "streamer")
          return [];
        return [{ type: type as FollowTarget, id }];
      }),
    [follows],
  );

  const updateProfile = React.useCallback((patch: Partial<Profile>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const completeOnboarding = React.useCallback(() => {
    setOnboardingComplete(true);
    void persist.set<boolean>(ONBOARD_KEY, true);
  }, []);

  const resetOnboarding = React.useCallback(() => {
    setOnboardingComplete(false);
    void persist.remove(ONBOARD_KEY);
  }, []);

  const role = roleOf(user);

  // Legacy compat: accept either (role) → no-op-with-warn, or (email, password) → real signIn.
  const legacyLogin = React.useCallback(
    (roleOrEmail: Role | string, password?: string) => {
      if (password !== undefined) return signIn(roleOrEmail, password);
      if (__DEV__) {
        console.warn(
          "[auth] legacy login(role) is a no-op on real auth. " +
            "Migrate the call site to signIn(email, password) or signUp({...}).",
        );
      }
    },
    [signIn],
  );

  const legacySwitchRole = React.useCallback(() => {
    if (__DEV__) {
      console.warn(
        "[auth] switchRole() is a no-op on real auth. Roles are set server-side.",
      );
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      accountEmail,
      role,
      isLoading,
      isAuthenticated: !!user,
      publisherMemberships,
      refreshMemberships,
      signIn,
      signUp,
      signInWithSocial,
      signOut,
      toggleFollow,
      isFollowing,
      followsList,
      updateProfile,
      onboardingComplete,
      completeOnboarding,
      resetOnboarding,
      // Compat
      login: legacyLogin,
      logout: signOut,
      switchRole: legacySwitchRole,
    }),
    [
      user,
      accountEmail,
      role,
      isLoading,
      publisherMemberships,
      refreshMemberships,
      signIn,
      signUp,
      signInWithSocial,
      signOut,
      toggleFollow,
      isFollowing,
      followsList,
      updateProfile,
      onboardingComplete,
      completeOnboarding,
      resetOnboarding,
      legacyLogin,
      legacySwitchRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

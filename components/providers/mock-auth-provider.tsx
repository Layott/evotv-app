import * as React from "react";

import type { Profile, Role } from "@/lib/types";
import { profiles } from "@/lib/mock/users";
import { persist } from "@/lib/storage/persist";

type FollowTarget = "team" | "player" | "streamer";

interface MockAuthContextValue {
  user: Profile | null;
  role: Role;
  isLoading: boolean;
  login: (role: Role) => void;
  logout: () => void;
  signIn: (role: Role) => void;
  signOut: () => void;
  switchRole: (role: Role) => void;
  toggleFollow: (targetType: FollowTarget, targetId: string) => void;
  isFollowing: (targetType: FollowTarget, targetId: string) => boolean;
  updateProfile: (patch: Partial<Profile>) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const SESSION_KEY = "evotv:current-user";
const FOLLOWS_KEY = "evotv:follows";
const ONBOARD_KEY = "evotv:onboarded";

const MockAuthContext = React.createContext<MockAuthContextValue | null>(null);

interface PersistedSession {
  role: Role;
  userId?: string;
}

function pickProfileByRole(role: Role): Profile | null {
  if (role === "guest") return null;
  if (role === "admin") return profiles.find((p) => p.role === "admin") ?? null;
  if (role === "premium") return profiles.find((p) => p.role === "premium") ?? null;
  return profiles.find((p) => p.role === "user") ?? null;
}

interface MockAuthProviderProps {
  children: React.ReactNode;
}

export function MockAuthProvider({ children }: MockAuthProviderProps) {
  const [role, setRole] = React.useState<Role>("guest");
  const [user, setUser] = React.useState<Profile | null>(null);
  const [follows, setFollows] = React.useState<Set<string>>(new Set());
  const [onboardingComplete, setOnboardingComplete] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await persist.get<PersistedSession>(SESSION_KEY);
      const followsList = await persist.get<string[]>(FOLLOWS_KEY);
      const onboarded = await persist.get<boolean>(ONBOARD_KEY);
      if (cancelled) return;
      const hydratedRole: Role = session?.role ?? "user";
      setRole(hydratedRole);
      setUser(pickProfileByRole(hydratedRole));
      if (!session?.role) {
        void persist.set<PersistedSession>(SESSION_KEY, { role: "user" });
      }
      if (Array.isArray(followsList)) {
        setFollows(new Set(followsList));
      }
      if (onboarded === true) {
        setOnboardingComplete(true);
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = React.useCallback((nextRole: Role) => {
    setRole(nextRole);
    const next = pickProfileByRole(nextRole);
    setUser(next);
    void persist.set<PersistedSession>(SESSION_KEY, {
      role: nextRole,
      userId: next?.id,
    });
  }, []);

  const logout = React.useCallback(() => {
    setRole("guest");
    setUser(null);
    void persist.remove(SESSION_KEY);
  }, []);

  const toggleFollow = React.useCallback(
    (targetType: FollowTarget, targetId: string) => {
      const key = `${targetType}:${targetId}`;
      setFollows((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        void persist.set<string[]>(FOLLOWS_KEY, [...next]);
        return next;
      });
    },
    [],
  );

  const isFollowing = React.useCallback(
    (targetType: FollowTarget, targetId: string) => {
      return follows.has(`${targetType}:${targetId}`);
    },
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

  const value = React.useMemo<MockAuthContextValue>(
    () => ({
      user,
      role,
      isLoading,
      login,
      logout,
      signIn: login,
      signOut: logout,
      switchRole: login,
      toggleFollow,
      isFollowing,
      updateProfile,
      onboardingComplete,
      completeOnboarding,
      resetOnboarding,
    }),
    [
      user,
      role,
      isLoading,
      login,
      logout,
      toggleFollow,
      isFollowing,
      updateProfile,
      onboardingComplete,
      completeOnboarding,
      resetOnboarding,
    ],
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth(): MockAuthContextValue {
  const ctx = React.useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used inside <MockAuthProvider>");
  return ctx;
}

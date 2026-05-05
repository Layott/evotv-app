import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Async key/value persistence over AsyncStorage. JSON-serialised.
 * Mirrors the web app's typed helpers but is fully async — RN has no synchronous storage.
 */
export const persist = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* noop */
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

/**
 * Synchronous-feeling cache backed by AsyncStorage.
 *
 * Why this exists: the web mocks rely on synchronous `localStorage.getItem` /
 * `localStorage.setItem` semantics. AsyncStorage is async-only, so we keep an
 * in-memory mirror that:
 *   - returns the empty-state default synchronously on first call
 *     (identical to the web `typeof window === "undefined"` SSR branch);
 *   - hydrates from AsyncStorage on first access without blocking;
 *   - flushes writes asynchronously, fire-and-forget.
 *
 * This preserves every existing call-site signature in lib/mock/* without
 * forcing them to become async.
 */
const memoryCache: Record<string, string | undefined> = {};
const hydratedKeys = new Set<string>();
const hydrationInflight: Record<string, Promise<void>> = {};

function startHydration(key: string): void {
  if (hydratedKeys.has(key) || key in hydrationInflight) return;
  hydrationInflight[key] = (async () => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw !== null) memoryCache[key] = raw;
    } catch {
      /* noop */
    } finally {
      hydratedKeys.add(key);
      delete hydrationInflight[key];
    }
  })();
}

/**
 * Synchronous read from the in-memory cache. On first call for a key, kicks off
 * an async hydrate from AsyncStorage and returns `null`. Subsequent calls (after
 * any tick) will see the persisted value if one existed.
 */
export function syncGet(key: string): string | null {
  if (!hydratedKeys.has(key)) startHydration(key);
  const v = memoryCache[key];
  return v === undefined ? null : v;
}

/**
 * Synchronous write — updates the memory cache immediately and fires an async
 * AsyncStorage write in the background. Returns void.
 */
export function syncSet(key: string, value: string): void {
  memoryCache[key] = value;
  hydratedKeys.add(key);
  AsyncStorage.setItem(key, value).catch(() => {
    /* noop */
  });
}

/**
 * Synchronous remove — clears memory and fires async AsyncStorage delete.
 */
export function syncRemove(key: string): void {
  delete memoryCache[key];
  hydratedKeys.add(key);
  AsyncStorage.removeItem(key).catch(() => {
    /* noop */
  });
}

/**
 * Imperatively await hydration for a specific key. Useful from screens that
 * want to ensure the cache is warm before rendering.
 */
export async function awaitHydration(key: string): Promise<void> {
  startHydration(key);
  const inflight = hydrationInflight[key];
  if (inflight) await inflight;
}

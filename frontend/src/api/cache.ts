// In-memory instant client-side cache for high-speed navigation (< 1s)
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export const cacheService = {
  get<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      memoryCache.delete(key);
      return null;
    }
    return entry.data as T;
  },

  set<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL_MS): void {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  },

  invalidate(pattern?: string): void {
    if (!pattern) {
      memoryCache.clear();
      return;
    }
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
  },
};

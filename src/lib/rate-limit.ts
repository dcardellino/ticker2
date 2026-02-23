/**
 * In-memory sliding-window rate limiter for API routes.
 *
 * NOTE: This is per-serverless-instance. On Vercel, multiple instances may run
 * in parallel, so this is a best-effort defense against single-instance abuse.
 * For production rate limiting across all instances, use Upstash or similar.
 */

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

/**
 * Check whether a given key is within the allowed rate limit.
 * @param key      Unique key, e.g. `${userId}:${endpoint}`
 * @param max      Maximum number of requests per window
 * @param windowMs Sliding window duration in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the sliding window
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= max) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

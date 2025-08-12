import { getRedis } from "@/lib/redis/client";

export async function rateLimit(key: string, limit: number, windowSec: number) {
  const redis = getRedis();
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSec * 1000))}`;
  const count = await redis.incr(windowKey);
  if (count === 1) await redis.expire(windowKey, windowSec);
  return count <= limit;
}

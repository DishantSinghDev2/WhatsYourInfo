import redis from '@/lib/redis';

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? (JSON.parse(cached) as T) : null;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}

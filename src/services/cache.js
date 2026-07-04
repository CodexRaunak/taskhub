import { redis } from '../db/redis.js';

export async function cacheGet(key) {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttl = 300) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // silently fail
  }
}

export async function cacheDel(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // silently fail
  }
}

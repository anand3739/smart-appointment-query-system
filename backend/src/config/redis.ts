import Redis from 'ioredis';
import { env } from './env';

class MemoryCache {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const k of keys) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }
}

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
}

const memoryFallback = new MemoryCache();
let redisClient: CacheClient = memoryFallback;

if (process.env.NODE_ENV !== 'test') {
  try {
    const realRedis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 2) return null;
        return 500;
      },
      lazyConnect: true,
    });

    realRedis.on('error', () => {
      redisClient = memoryFallback;
    });

    realRedis.connect().then(() => {
      console.log(' Connected to Redis at', env.REDIS_URL);
      redisClient = realRedis as unknown as CacheClient;
    }).catch(() => {
      redisClient = memoryFallback;
    });
  } catch (e) {
    redisClient = memoryFallback;
  }
}

export const getCache = (): CacheClient => redisClient || memoryFallback;
export const redis = {
  get: (key: string) => getCache().get(key),
  set: (key: string, value: string, mode?: string, duration?: number) => getCache().set(key, value, mode, duration),
  del: (...keys: string[]) => getCache().del(...keys),
  keys: (pattern: string) => getCache().keys(pattern),
};

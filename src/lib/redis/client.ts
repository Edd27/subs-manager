import Redis from "ioredis";

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    ...args: (string | number)[]
  ): Promise<"OK" | null>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
};

let redis: RedisLike | undefined;

function createInMemoryRedis(): RedisLike {
  const store = new Map<
    string,
    { value: string; timeout?: NodeJS.Timeout; expiresAt?: number }
  >();

  function ensureNotExpired(key: string) {
    const entry = store.get(key);
    if (!entry) return;
    if (entry.expiresAt && Date.now() >= entry.expiresAt) {
      if (entry.timeout) clearTimeout(entry.timeout);
      store.delete(key);
    }
  }

  return {
    async get(key) {
      ensureNotExpired(key);
      const entry = store.get(key);
      return entry ? entry.value : null;
    },
    async set(key, value, ...args) {
      let ttlMs: number | undefined;
      if (args.length >= 2 && typeof args[0] === "string") {
        const flag = String(args[0]).toUpperCase();
        const n = Number(args[1]);
        if (!Number.isNaN(n)) {
          if (flag === "EX") ttlMs = n * 1000;
          if (flag === "PX") ttlMs = n;
        }
      }
      const prev = store.get(key);
      if (prev?.timeout) clearTimeout(prev.timeout);
      let timeout: NodeJS.Timeout | undefined;
      let expiresAt: number | undefined;
      if (ttlMs && ttlMs > 0) {
        expiresAt = Date.now() + ttlMs;
        timeout = setTimeout(() => store.delete(key), ttlMs);
      }
      store.set(key, { value, timeout, expiresAt });
      return "OK";
    },
    async del(key) {
      const entry = store.get(key);
      if (entry?.timeout) clearTimeout(entry.timeout);
      const existed = store.delete(key);
      return existed ? 1 : 0;
    },
    async incr(key) {
      ensureNotExpired(key);
      const current = store.get(key);
      const next = (current ? Number(current.value) || 0 : 0) + 1;
      const timeout = current?.timeout;
      const expiresAt = current?.expiresAt;
      store.set(key, { value: String(next), timeout, expiresAt });
      return next;
    },
    async expire(key, seconds) {
      const entry = store.get(key);
      if (!entry) return 0;
      if (entry.timeout) clearTimeout(entry.timeout);
      const ttlMs = Math.max(0, seconds) * 1000;
      entry.expiresAt = Date.now() + ttlMs;
      entry.timeout = setTimeout(() => store.delete(key), ttlMs);
      store.set(key, entry);
      return 1;
    },
  };
}

function createSafeRedis(url: string): RedisLike {
  const memory = createInMemoryRedis();
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    retryStrategy: () => null,
    reconnectOnError: () => false,
  });
  client.on("error", () => {});

  async function tryOrFallback<T>(op: () => Promise<T>, fb: () => Promise<T>) {
    try {
      return await op();
    } catch {
      return fb();
    }
  }

  return {
    async get(key) {
      return tryOrFallback(
        () => client.get(key),
        () => memory.get(key)
      );
    },
    async set(key, value, ...args) {
      return tryOrFallback(
        () =>
          (client.set as unknown as (...a: unknown[]) => Promise<"OK">).apply(
            client,
            [key, value, ...args]
          ),
        () => memory.set(key, value, ...args)
      );
    },
    async del(key) {
      return tryOrFallback(
        () => client.del(key),
        () => memory.del(key)
      );
    },
    async incr(key) {
      return tryOrFallback(
        () => client.incr(key),
        () => memory.incr(key)
      );
    },
    async expire(key, seconds) {
      return tryOrFallback(
        () => client.expire(key, seconds),
        () => memory.expire(key, seconds)
      );
    },
  };
}

export function getRedis(): RedisLike {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  const disableDuringBuild =
    process.env.REDIS_DISABLE_DURING_BUILD === "1" ||
    process.env.REDIS_DISABLE_DURING_BUILD === "true";
  if (disableDuringBuild) {
    redis = createInMemoryRedis();
    return redis;
  }
  if (!url) {
    redis = createInMemoryRedis();
    return redis;
  }
  redis = createSafeRedis(url);
  return redis;
}

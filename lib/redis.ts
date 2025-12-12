import "server-only";

import Redis from "ioredis";

import { getEnv } from "@/lib/env";

type GlobalWithRedis = typeof globalThis & {
  __redis?: Redis;
};

const globalWithRedis = globalThis as GlobalWithRedis;
let localRedis: Redis | undefined;

export function getRedis(): Redis {
  if (globalWithRedis.__redis) return globalWithRedis.__redis;
  if (localRedis) return localRedis;

  const instance = new Redis(getEnv().REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  localRedis = instance;

  if (process.env.NODE_ENV !== "production") {
    globalWithRedis.__redis = instance;
  }

  return instance;
}

export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const instance = getRedis();
    const value = (instance as unknown as Record<PropertyKey, unknown>)[prop];

    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }

    return value;
  },
}) as Redis;

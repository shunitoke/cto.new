import "server-only";

import Redis from "ioredis";

import { env } from "@/lib/env";

type GlobalWithRedis = typeof globalThis & {
  __redis?: Redis;
};

const globalWithRedis = globalThis as GlobalWithRedis;

export const redis =
  globalWithRedis.__redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalWithRedis.__redis = redis;
}

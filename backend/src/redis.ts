import { Redis } from "@upstash/redis/cloudflare";

import type { Env } from "./env";

export const getRedisClient = (env: Env) => {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Redis env variables are missing");
  }

  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
};

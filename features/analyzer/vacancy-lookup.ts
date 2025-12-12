import "server-only";

import { z } from "zod";

import { redis } from "@/lib/redis";

const redisVacancySchema = z.object({
  description: z.string().min(1),
});

export async function getVacancyDescriptionById(id: string): Promise<string | null> {
  const candidates = [`vacancy:${id}`, `hh:vacancy:${id}`];

  for (const key of candidates) {
    const raw = await redis.get(key);
    if (!raw) continue;

    try {
      const parsed = redisVacancySchema.safeParse(JSON.parse(raw) as unknown);
      if (parsed.success) return parsed.data.description;
    } catch {
      // ignore invalid JSON
    }
  }

  return null;
}

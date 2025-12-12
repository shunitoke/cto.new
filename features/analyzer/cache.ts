import "server-only";

import { redis } from "@/lib/redis";
import type { VacancyAnalysis } from "@/features/analyzer/types";
import { AnalyzerError } from "@/features/analyzer/errors";

const CACHE_PREFIX = "analyzer:vacancy:v1:";
export const ANALYZE_CACHE_TTL_SECONDS = 60 * 60 * 12;

export function getVacancyAnalysisCacheKey(descriptionHash: string): string {
  return `${CACHE_PREFIX}${descriptionHash}`;
}

export async function getCachedVacancyAnalysis(
  descriptionHash: string,
): Promise<VacancyAnalysis | null> {
  const key = getVacancyAnalysisCacheKey(descriptionHash);

  let raw: string | null;
  try {
    raw = await redis.get(key);
  } catch (error) {
    throw new AnalyzerError("Failed to read analysis from Redis", 503, "REDIS_ERROR", {
      cause: error,
    });
  }

  if (!raw) return null;

  try {
    return JSON.parse(raw) as VacancyAnalysis;
  } catch {
    try {
      await redis.del(key);
    } catch {
      // ignore
    }

    return null;
  }
}

export async function setCachedVacancyAnalysis(
  descriptionHash: string,
  analysis: VacancyAnalysis,
): Promise<void> {
  const key = getVacancyAnalysisCacheKey(descriptionHash);

  try {
    await redis.set(key, JSON.stringify(analysis), "EX", ANALYZE_CACHE_TTL_SECONDS);
  } catch (error) {
    throw new AnalyzerError("Failed to write analysis to Redis", 503, "REDIS_ERROR", {
      cause: error,
    });
  }
}

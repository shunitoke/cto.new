import "server-only";

import {
  getCachedVacancyAnalysis,
  setCachedVacancyAnalysis,
} from "@/features/analyzer/cache";
import { analyzerInFlight } from "@/features/analyzer/inflight";
import { analyzeVacancyWithOpenRouter } from "@/features/analyzer/openrouter-analyze";
import { hashVacancyDescription } from "@/features/analyzer/hash";
import type { AnalyzeVacancyResult, VacancyAnalysis } from "@/features/analyzer/types";
import { AnalyzerError } from "@/features/analyzer/errors";

function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

export function computeCompatibilityScore(input: {
  stressFreeScore: number;
  remoteFriendlinessScore: number;
  learningOpportunitiesScore: number;
}): number {
  const raw =
    0.4 * input.stressFreeScore +
    0.3 * input.remoteFriendlinessScore +
    0.3 * input.learningOpportunitiesScore;

  return clampScore(Math.round(raw));
}

async function runAnalysisAndCache(
  descriptionHash: string,
  description: string,
): Promise<VacancyAnalysis> {
  const llm = await analyzeVacancyWithOpenRouter(description);

  const analysis: VacancyAnalysis = {
    stressFreeScore: llm.stressFreeScore,
    remoteFriendlinessScore: llm.remoteFriendlinessScore,
    learningOpportunitiesScore: llm.learningOpportunitiesScore,
    compatibilityScore: computeCompatibilityScore(llm),
    explanation: llm.explanation,
  };

  await setCachedVacancyAnalysis(descriptionHash, analysis);
  return analysis;
}

export async function analyzeVacancyDescription(
  description: string,
): Promise<AnalyzeVacancyResult> {
  const descriptionForModel = description.trim();

  if (!descriptionForModel) {
    throw new AnalyzerError("Vacancy description is empty", 400, "INVALID_REQUEST");
  }

  const descriptionHash = hashVacancyDescription(descriptionForModel);

  const cached = await getCachedVacancyAnalysis(descriptionHash);
  if (cached) {
    return { descriptionHash, cached: true, analysis: cached };
  }

  const existing = analyzerInFlight.get(descriptionHash);
  if (existing) {
    return { descriptionHash, cached: false, analysis: await existing };
  }

  const promise = runAnalysisAndCache(descriptionHash, descriptionForModel);
  analyzerInFlight.set(descriptionHash, promise);

  try {
    const analysis = await promise;
    return { descriptionHash, cached: false, analysis };
  } finally {
    if (analyzerInFlight.get(descriptionHash) === promise) {
      analyzerInFlight.delete(descriptionHash);
    }
  }
}

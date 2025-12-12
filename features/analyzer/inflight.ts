import "server-only";

import type { VacancyAnalysis } from "@/features/analyzer/types";

type GlobalWithAnalyzerInFlight = typeof globalThis & {
  __analyzerInFlight?: Map<string, Promise<VacancyAnalysis>>;
};

const globalWithAnalyzerInFlight = globalThis as GlobalWithAnalyzerInFlight;

export const analyzerInFlight =
  globalWithAnalyzerInFlight.__analyzerInFlight ??
  new Map<string, Promise<VacancyAnalysis>>();

if (process.env.NODE_ENV !== "production") {
  globalWithAnalyzerInFlight.__analyzerInFlight = analyzerInFlight;
}

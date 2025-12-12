import "server-only";

import { z } from "zod";

export const llmVacancyAnalysisSchema = z.object({
  stressFreeScore: z.number().int().min(0).max(100),
  remoteFriendlinessScore: z.number().int().min(0).max(100),
  learningOpportunitiesScore: z.number().int().min(0).max(100),
  explanation: z.string().min(1).max(2_000),
});

export type LlmVacancyAnalysis = z.infer<typeof llmVacancyAnalysisSchema>;

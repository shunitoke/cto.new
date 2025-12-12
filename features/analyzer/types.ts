import "server-only";

export type VacancyAnalysis = {
  stressFreeScore: number;
  remoteFriendlinessScore: number;
  learningOpportunitiesScore: number;
  compatibilityScore: number;
  explanation: string;
};

export type AnalyzeVacancyResult = {
  descriptionHash: string;
  cached: boolean;
  analysis: VacancyAnalysis;
};

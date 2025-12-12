export type ExperienceLevel = "intern" | "junior" | "mid" | "senior" | "lead";

export type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  remote: boolean;
  experience: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: "RUB" | "USD" | "EUR";
  tags: string[];
  description: string;
};

export type JobsResponse = {
  items: Job[];
  total: number;
  nextCursor: string | null;
  facets: {
    cities: string[];
    salaryMin: number;
    salaryMax: number;
  };
};

export type AnalyzeResponse = {
  id: string | null;
  descriptionHash: string;
  cached: boolean;
  score: number;
  rationale: string;
  analysis: {
    stressFreeScore: number;
    remoteFriendlinessScore: number;
    learningOpportunitiesScore: number;
    compatibilityScore: number;
    explanation: string;
  };
};

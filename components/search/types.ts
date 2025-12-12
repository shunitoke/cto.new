export type ExperienceLevel = "noExperience" | "between1And3" | "between3And6" | "moreThan6";

export type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  remote: boolean;
  experience?: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: "RUB" | "USD" | "EUR" | "KZT" | "BYN" | "UAH" | "AZN" | "UZS" | "GEL";
  tags: string[];
  description: string;
  publishedAt?: string;
  url?: string;
  applyUrl?: string;
  employer?: {
    id: string;
    name: string;
    logo?: string;
    trusted?: boolean;
  };
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

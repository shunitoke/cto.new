import "server-only";

export type ExperienceLevel = "intern" | "junior" | "mid" | "senior" | "lead";

export type Currency = "RUB" | "USD" | "EUR";

export type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  remote: boolean;
  experience: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: Currency;
  tags: string[];
  description: string;
};

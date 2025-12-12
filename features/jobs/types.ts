import "server-only";

// hh.ru API experience levels
export type ExperienceLevel = "noExperience" | "between1And3" | "between3And6" | "moreThan6";

// Currencies supported by hh.ru API
export type Currency = "RUB" | "USD" | "EUR" | "KZT" | "BYN" | "UAH" | "AZN" | "UZS" | "GEL";

export type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  remote: boolean;
  experience?: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: Currency;
  tags: string[];
  description: string;
  publishedAt: string;
  url: string;
  applyUrl: string;
  employer: {
    id: string;
    name: string;
    logo?: string;
    trusted?: boolean;
  };
};

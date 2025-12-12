import "server-only";

import { allJobs } from "@/features/jobs/data";
import type { ExperienceLevel, Job } from "@/features/jobs/types";

export type JobSearchQuery = {
  keyword?: string;
  city?: string;
  salaryMin?: number;
  salaryMax?: number;
  experience?: ExperienceLevel;
  remoteOnly?: boolean;
};

export type JobSearchResult = {
  items: Job[];
  total: number;
  nextCursor: string | null;
  facets: {
    cities: string[];
    salaryMin: number;
    salaryMax: number;
  };
};

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function salaryOverlaps(
  job: Job,
  requestedMin: number | undefined,
  requestedMax: number | undefined,
): boolean {
  if (requestedMin === undefined && requestedMax === undefined) return true;
  if (job.salaryMin === null && job.salaryMax === null) return false;

  const min = job.salaryMin ?? job.salaryMax ?? 0;
  const max = job.salaryMax ?? job.salaryMin ?? min;

  if (requestedMin !== undefined && max < requestedMin) return false;
  if (requestedMax !== undefined && min > requestedMax) return false;

  return true;
}

export function searchJobs(
  query: JobSearchQuery,
  { offset, limit }: { offset: number; limit: number },
): JobSearchResult {
  const keyword = query.keyword?.trim();
  const city = query.city?.trim();

  const filtered = allJobs.filter((job) => {
    if (keyword) {
      const blob = [job.title, job.company, job.city, job.description, job.tags.join(" ")].join("\n");
      if (!includesInsensitive(blob, keyword)) return false;
    }

    if (city) {
      if (!includesInsensitive(job.city, city)) return false;
    }

    if (query.experience) {
      if (job.experience !== query.experience) return false;
    }

    if (query.remoteOnly) {
      if (!job.remote) return false;
    }

    if (!salaryOverlaps(job, query.salaryMin, query.salaryMax)) return false;

    return true;
  });

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);
  const nextCursor = offset + limit < total ? String(offset + limit) : null;

  const salaries = allJobs
    .flatMap((job) => [job.salaryMin, job.salaryMax])
    .filter((v): v is number => typeof v === "number");

  const facets = {
    cities: Array.from(new Set(allJobs.map((j) => j.city))).sort((a, b) => a.localeCompare(b)),
    salaryMin: salaries.length ? Math.min(...salaries) : 0,
    salaryMax: salaries.length ? Math.max(...salaries) : 0,
  };

  return { items, total, nextCursor, facets };
}

import { z } from "zod";
import axios, { AxiosInstance } from "axios";
import { HttpError } from "@/lib/errors";
import { withRetry } from "@/lib/retry";

const HH_API_BASE = "https://api.hh.ru";

export enum ExperienceLevel {
  NoExperience = "noExp",
  OneTo3 = "1-3",
  ThreeTo6 = "3-6",
  SixPlus = "6-plus",
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JobPostingSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  employer: z.object({
    name: z.string(),
  }),
  salary: z
    .object({
      from: z.number().nullable(),
      to: z.number().nullable(),
      currency: z.string(),
    })
    .nullable(),
  area: z.object({
    name: z.string(),
  }),
  schedule: z.object({
    name: z.string(),
  }),
  published_at: z.string().datetime(),
  snippet: z.object({
    responsibility: z.string().nullable(),
    requirement: z.string().nullable(),
  }),
});

export type JobPosting = z.infer<typeof JobPostingSchema>;

const HHVacancySchema = z.object({
  id: z.string(),
  name: z.string(),
  alternate_url: z.string().url(),
  employer: z.object({
    name: z.string(),
  }),
  salary: z
    .object({
      from: z.number().nullable(),
      to: z.number().nullable(),
      currency: z.string(),
    })
    .nullable(),
  area: z.object({
    name: z.string(),
  }),
  schedule: z.object({
    name: z.string(),
  }),
  published_at: z.string().datetime(),
  snippet: z.object({
    responsibility: z.string().nullable(),
    requirement: z.string().nullable(),
  }),
});

type HHVacancy = z.infer<typeof HHVacancySchema>;

const SearchResultsSchema = z.object({
  items: z.array(HHVacancySchema),
  found: z.number(),
  page: z.number(),
  pages: z.number(),
});

export interface JobSearchParams {
  text?: string;
  city?: string;
  experience?: ExperienceLevel;
  salaryFrom?: number;
  salaryTo?: number;
  salaryOnly?: boolean;
  remoteOnly?: boolean;
  page?: number;
}

export interface JobSearchResult {
  jobs: JobPosting[];
  total: number;
  page: number;
  pages: number;
}

export class HHClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: HH_API_BASE,
      timeout: 5000,
      headers: {
        "User-Agent": "NextJS-App/1.0",
      },
    });
  }

  private buildSearchQuery(params: JobSearchParams): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (params.text) {
      query.text = params.text;
    }

    if (params.city) {
      query.area = params.city;
    }

    if (params.experience) {
      query.experience = params.experience;
    }

    if (params.salaryFrom !== undefined) {
      query.salary_from = params.salaryFrom;
    }

    if (params.salaryTo !== undefined) {
      query.salary_to = params.salaryTo;
    }

    if (params.salaryOnly) {
      query.only_with_salary = true;
    }

    if (params.remoteOnly) {
      query.schedule = "remote";
    }

    if (params.page !== undefined) {
      query.page = params.page;
    }

    query.per_page = 50;

    return query;
  }

  private mapVacancyToJobPosting(vacancy: HHVacancy): JobPosting {
    return {
      id: vacancy.id,
      name: vacancy.name,
      url: vacancy.alternate_url,
      employer: {
        name: vacancy.employer.name,
      },
      salary: vacancy.salary,
      area: {
        name: vacancy.area.name,
      },
      schedule: {
        name: vacancy.schedule.name,
      },
      published_at: vacancy.published_at,
      snippet: {
        responsibility: vacancy.snippet.responsibility,
        requirement: vacancy.snippet.requirement,
      },
    };
  }

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    return withRetry(
      async () => {
        try {
          const query = this.buildSearchQuery(params);
          const response = await this.axiosInstance.get("/vacancies", {
            params: query,
          });

          const validated = SearchResultsSchema.parse(response.data);

          return {
            jobs: validated.items.map((item) =>
              this.mapVacancyToJobPosting(item),
            ),
            total: validated.found,
            page: validated.page,
            pages: validated.pages,
          };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message = error.response?.statusText ?? error.message;
            throw new HttpError(
              `HH API request failed: ${message}`,
              status,
              error.config?.url ?? HH_API_BASE,
              error.response?.data,
            );
          }
          throw error;
        }
      },
      {
        retries: 2,
        minDelayMs: 250,
        maxDelayMs: 2000,
        shouldRetry: (error) => {
          if (error instanceof HttpError) {
            return error.status >= 500 || error.status === 429;
          }
          return true;
        },
      },
    );
  }

  getVacancyUrl(id: string): string {
    return `${HH_API_BASE}/vacancies/${id}`;
  }
}

export const hhClient = new HHClient();

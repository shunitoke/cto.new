import "server-only";

/**
 * hh.ru API Client
 * 
 * Official API documentation: https://api.hh.ru
 * OpenAPI specification: https://github.com/hhru/api/blob/master/openapi.yml
 * 
 * Example requests:
 * 
 * 1. Search by keyword:
 *    GET /vacancies?text=frontend&area=1&per_page=20&page=0
 *    curl -H "User-Agent: MyApp/1.0" https://api.hh.ru/vacancies?text=frontend&area=1&per_page=20&page=0
 * 
 * 2. Search by salary and experience:
 *    GET /vacancies?text=developer&salary=100000&only_with_salary=true&experience=between3And6&per_page=50
 *    curl -H "User-Agent: MyApp/1.0" https://api.hh.ru/vacancies?text=developer&salary=100000&only_with_salary=true&experience=between3And6&per_page=50
 * 
 * 3. Search with pagination:
 *    GET /vacancies?text=python&per_page=100&page=1
 *    curl -H "User-Agent: MyApp/1.0" https://api.hh.ru/vacancies?text=python&per_page=100&page=1
 * 
 * Required headers:
 * - User-Agent: Your application name (required by hh.ru API)
 * 
 * Rate limiting:
 * - 4 requests per second for anonymous users
 * - Requests without User-Agent may be blocked
 */

const BASE_URL = "https://api.hh.ru";

// Experience levels as defined in hh.ru API
export type ExperienceId =
  | "noExperience"
  | "between1And3"
  | "between3And6"
  | "moreThan6";

// Employment types as defined in hh.ru API
export type EmploymentFormId =
  | "full"
  | "part"
  | "project"
  | "probation"
  | "temporary"
  | "volunteer"
  | "remote";

// Salary object from API
export interface HHSalary {
  currency: "RUR" | "USD" | "EUR" | "KZT" | "BYN" | "UAH" | "AZN" | "UZS" | "GEL";
  from: number | null;
  gross: boolean;
  to: number | null;
}

// Address object from API
export interface HHAddress {
  building: string | null;
  city: string;
  description: string | null;
  lat: number | null;
  lng: number | null;
  metro_stations: Array<{
    id: string;
    name: string;
    line_id: string;
    line_name: string;
    lat: number;
    lng: number;
  }> | null;
  raw: string;
  street: string | null;
}

// Employer object from API
export interface HHEmployer {
  id: string;
  name: string;
  url: string;
  alternate_url: string;
  logo_urls: {
    "90"?: string;
    "240"?: string;
    original?: string;
  } | null;
  trusted: boolean;
  accredited_it_employer: boolean;
  country_id: number;
}

// Area/Region object
export interface HHArea {
  id: string;
  name: string;
  url: string;
}

// Single vacancy from search results
export interface HHVacancy {
  id: string;
  name: string;
  area: HHArea;
  salary: HHSalary | null;
  address: HHAddress | null;
  published_at: string;
  employer: HHEmployer;
  alternate_url: string;
  apply_alternate_url: string;
  url: string;
  snippet: {
    requirement: string | null;
    responsibility: string | null;
  };
  schedule?: {
    id: string;
    name: string;
  } | null;
  employment_form?: {
    id: string;
    name: string;
  } | null;
  type?: {
    id: string;
    name: string;
  } | null;
  accept_incomplete_resumes?: boolean;
  accept_temporary?: boolean;
  benefits?: string[] | null;
  professional_roles?: Array<{
    id: string;
    name: string;
  }> | null;
  counters?: {
    responses: number;
  };
}

// Search response from API
export interface HHSearchResponse {
  items: HHVacancy[];
  found: number;
  page: number;
  pages: number;
  per_page: number;
  arguments?: Array<{
    argument: string;
    value: string;
    value_description?: string;
  }>;
  clusters?: unknown;
  suggests?: unknown;
  fixes?: unknown;
}

// Search parameters
export interface HHSearchParams {
  text?: string;
  area?: string;
  salary?: number;
  currency?: string;
  only_with_salary?: boolean;
  experience?: ExperienceId;
  employment_form?: EmploymentFormId;
  work_format?: string;
  page?: number;
  per_page?: number;
  order_by?: string;
  date_from?: string;
  date_to?: string;
  professional_role?: string;
  industry?: string;
  employer_id?: string;
  metro?: string;
  describe_arguments?: boolean;
  clusters?: boolean;
  no_magic?: boolean;
  premium?: boolean;
  responses_count_enabled?: boolean;
}

/**
 * Builds query string from parameters, filtering out undefined and null values
 */
function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  );

  if (entries.length === 0) return "";

  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.append(key, String(value));
  }

  return searchParams.toString();
}

/**
 * Search vacancies on hh.ru
 * 
 * @param params Search parameters
 * @returns Search results with vacancies
 * 
 * @example
 * const results = await searchVacancies({
 *   text: 'frontend',
 *   area: '1', // Moscow
 *   experience: 'between3And6',
 *   only_with_salary: true,
 *   per_page: 20,
 * });
 */
export async function searchVacancies(
  params: HHSearchParams
): Promise<HHSearchResponse> {
  const queryString = buildQueryString({
    text: params.text,
    area: params.area,
    salary: params.salary,
    currency: params.currency,
    only_with_salary: params.only_with_salary,
    experience: params.experience,
    employment_form: params.employment_form,
    work_format: params.work_format,
    page: params.page ?? 0,
    per_page: params.per_page ?? 20,
    order_by: params.order_by,
    date_from: params.date_from,
    date_to: params.date_to,
    professional_role: params.professional_role,
    industry: params.industry,
    employer_id: params.employer_id,
    metro: params.metro,
    describe_arguments: params.describe_arguments,
    clusters: params.clusters,
    no_magic: params.no_magic,
    premium: params.premium,
    responses_count_enabled: params.responses_count_enabled,
  });

  const url = `${BASE_URL}/vacancies${queryString ? "?" + queryString : ""}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "hh-job-search/1.0 (+https://github.com/yourusername/project)",
    },
  });

  if (!response.ok) {
    const error = new Error(`hh.ru API error: ${response.status}`);
    const apiError = error as Error & { status?: number };
    apiError.status = response.status;
    throw apiError;
  }

  const data = (await response.json()) as HHSearchResponse;
  return data;
}

/**
 * Get a single vacancy by ID
 * 
 * @example
 * const vacancy = await getVacancy('8331228');
 */
export async function getVacancy(vacancyId: string): Promise<HHVacancy> {
  const url = `${BASE_URL}/vacancies/${vacancyId}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "hh-job-search/1.0 (+https://github.com/yourusername/project)",
    },
  });

  if (!response.ok) {
    const error = new Error(`Failed to fetch vacancy ${vacancyId}: ${response.status}`);
    const apiError = error as Error & { status?: number };
    apiError.status = response.status;
    throw apiError;
  }

  const data = (await response.json()) as HHVacancy;
  return data;
}

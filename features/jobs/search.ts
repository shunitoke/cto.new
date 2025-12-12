import "server-only";

import { searchVacancies } from "@/lib/hh";
import type { ExperienceLevel, Job, Currency } from "@/features/jobs/types";
import type { HHVacancy } from "@/lib/hh";

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

/**
 * Determines if a location is remote based on various heuristics
 */
function isRemote(vacancy: HHVacancy): boolean {
  if (!vacancy.address) return false;

  const cityName = vacancy.address.city?.toLowerCase() || "";
  const rawAddress = vacancy.address.raw?.toLowerCase() || "";

  return (
    cityName.includes("remote") ||
    cityName === "удаленная работа" ||
    rawAddress.includes("remote") ||
    rawAddress.includes("удаленная")
  );
}

/**
 * Converts hh.ru vacancy to our Job type
 */
function convertVacancy(vacancy: HHVacancy): Job {
  const salary = vacancy.salary;
  const salaryMin = salary?.from ?? null;
  const salaryMax = salary?.to ?? null;

  const currencyMap: Record<string, Currency> = {
    RUR: "RUB",
    RUB: "RUB",
    USD: "USD",
    EUR: "EUR",
    KZT: "KZT",
    BYN: "BYN",
    UAH: "UAH",
    AZN: "AZN",
    UZS: "UZS",
    GEL: "GEL",
  };

  return {
    id: vacancy.id,
    title: vacancy.name,
    company: vacancy.employer.name,
    city: vacancy.area?.name || "Unknown",
    remote: isRemote(vacancy),
    experience: undefined,
    salaryMin,
    salaryMax,
    currency: currencyMap[salary?.currency || "RUR"] || "RUB",
    tags: vacancy.professional_roles?.map((r) => r.name) || [],
    description:
      (vacancy.snippet?.requirement || "") +
      "\n\n" +
      (vacancy.snippet?.responsibility || ""),
    publishedAt: vacancy.published_at,
    url: vacancy.url,
    applyUrl: vacancy.apply_alternate_url,
    employer: {
      id: vacancy.employer.id,
      name: vacancy.employer.name,
      logo: vacancy.employer.logo_urls?.["240"],
      trusted: vacancy.employer.trusted,
    },
  };
}

/**
 * Maps area name to hh.ru area ID
 * Common areas: Moscow=1, SPB=2, etc.
 */
function mapCityToAreaId(city: string | undefined): string | undefined {
  if (!city) return undefined;

  const cityLower = city.toLowerCase();
  const cityMap: Record<string, string> = {
    moscow: "1",
    москва: "1",
    "saint petersburg": "2",
    spb: "2",
    "санкт-петербург": "2",
    "спб": "2",
    kazan: "3",
    казань: "3",
    novosibirsk: "4",
    новосибирск: "4",
    yekaterinburg: "5",
    екатеринбург: "5",
  };

  return cityMap[cityLower];
}

export async function searchJobs(
  query: JobSearchQuery,
  { offset, limit }: { offset: number; limit: number },
): Promise<JobSearchResult> {
  const page = Math.floor(offset / limit);

  const areaId = mapCityToAreaId(query.city);

  try {
    const response = await searchVacancies({
      text: query.keyword,
      area: areaId,
      salary: query.salaryMin,
      only_with_salary: query.salaryMin !== undefined,
      experience: query.experience,
      per_page: limit,
      page: page,
    });

    const items = response.items.map(convertVacancy);

    const nextCursor =
      page < response.pages - 1 ? String((page + 1) * limit) : null;

    const facets = {
      cities: ["Moscow", "Saint Petersburg", "Kazan", "Novosibirsk", "Yekaterinburg"],
      salaryMin: 0,
      salaryMax: 500000,
    };

    return {
      items,
      total: response.found,
      nextCursor,
      facets,
    };
  } catch (error) {
    console.error("Error searching vacancies:", error);

    return {
      items: [],
      total: 0,
      nextCursor: null,
      facets: {
        cities: [],
        salaryMin: 0,
        salaryMax: 0,
      },
    };
  }
}

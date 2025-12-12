import { describe, it, expect, beforeEach } from "vitest";
import { HHClient, ExperienceLevel } from "@/lib/hh";

describe("HHClient", () => {
  let client: HHClient;

  beforeEach(() => {
    client = new HHClient();
  });

  describe("buildSearchQuery", () => {
    it("should build a query with only per_page when no params are provided", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({});
      expect(query).toEqual({ per_page: 50 });
    });

    it("should include text in the query", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({ text: "TypeScript" });
      expect(query.text).toBe("TypeScript");
      expect(query.per_page).toBe(50);
    });

    it("should include city as area in the query", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({ city: "Moscow" });
      expect(query.area).toBe("Moscow");
      expect(query.per_page).toBe(50);
    });

    it("should include experience level in the query", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({
        experience: ExperienceLevel.ThreeTo6,
      });
      expect(query.experience).toBe("3-6");
      expect(query.per_page).toBe(50);
    });

    it("should include salary range in the query", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({
        salaryFrom: 100000,
        salaryTo: 200000,
      });
      expect(query.salary_from).toBe(100000);
      expect(query.salary_to).toBe(200000);
      expect(query.per_page).toBe(50);
    });

    it("should include only_with_salary when salaryOnly is true", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({ salaryOnly: true });
      expect(query.only_with_salary).toBe(true);
      expect(query.per_page).toBe(50);
    });

    it("should include schedule as remote when remoteOnly is true", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({ remoteOnly: true });
      expect(query.schedule).toBe("remote");
      expect(query.per_page).toBe(50);
    });

    it("should include page number in the query", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({ page: 2 });
      expect(query.page).toBe(2);
      expect(query.per_page).toBe(50);
    });

    it("should build a complex query with multiple parameters", () => {
      const query = (client as unknown as { buildSearchQuery(params: object): Record<string, unknown> }).buildSearchQuery({
        text: "React",
        city: "Saint Petersburg",
        experience: ExperienceLevel.OneTo3,
        salaryFrom: 80000,
        salaryTo: 150000,
        salaryOnly: true,
        remoteOnly: true,
        page: 1,
      });

      expect(query).toEqual({
        text: "React",
        area: "Saint Petersburg",
        experience: "1-3",
        salary_from: 80000,
        salary_to: 150000,
        only_with_salary: true,
        schedule: "remote",
        page: 1,
        per_page: 50,
      });
    });
  });

  describe("mapVacancyToJobPosting", () => {
    it("should map vacancy to job posting correctly", () => {
      const vacancy = {
        id: "12345",
        name: "Senior Developer",
        alternate_url: "https://hh.ru/vacancy/12345",
        employer: {
          name: "Tech Company",
        },
        salary: {
          from: 100000,
          to: 150000,
          currency: "RUR",
        },
        area: {
          name: "Moscow",
        },
        schedule: {
          name: "Full-time",
        },
        published_at: "2024-01-01T10:00:00+0300",
        snippet: {
          responsibility: "Build web apps",
          requirement: "5+ years experience",
        },
      };

      const posting = (client as unknown as { mapVacancyToJobPosting(vacancy: object): object }).mapVacancyToJobPosting(vacancy);

      expect(posting).toEqual({
        id: "12345",
        name: "Senior Developer",
        url: "https://hh.ru/vacancy/12345",
        employer: {
          name: "Tech Company",
        },
        salary: {
          from: 100000,
          to: 150000,
          currency: "RUR",
        },
        area: {
          name: "Moscow",
        },
        schedule: {
          name: "Full-time",
        },
        published_at: "2024-01-01T10:00:00+0300",
        snippet: {
          responsibility: "Build web apps",
          requirement: "5+ years experience",
        },
      });
    });

    it("should handle null salary values", () => {
      const vacancy = {
        id: "12345",
        name: "Entry Level Developer",
        alternate_url: "https://hh.ru/vacancy/12345",
        employer: {
          name: "Tech Company",
        },
        salary: null,
        area: {
          name: "Moscow",
        },
        schedule: {
          name: "Full-time",
        },
        published_at: "2024-01-01T10:00:00+0300",
        snippet: {
          responsibility: null,
          requirement: null,
        },
      };

      const posting = (client as unknown as { mapVacancyToJobPosting(vacancy: object): Record<string, unknown> }).mapVacancyToJobPosting(vacancy);

      expect(posting.salary).toBeNull();
      expect((posting.snippet as Record<string, unknown>).responsibility).toBeNull();
      expect((posting.snippet as Record<string, unknown>).requirement).toBeNull();
    });
  });

  describe("getVacancyUrl", () => {
    it("should return correct vacancy URL", () => {
      const url = client.getVacancyUrl("12345");
      expect(url).toBe("https://api.hh.ru/vacancies/12345");
    });
  });
});

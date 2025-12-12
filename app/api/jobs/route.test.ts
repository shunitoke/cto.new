import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("API Query Parameter Validation", () => {
  const QueryParamsSchema = z.object({
    text: z.string().optional(),
    city: z.string().optional(),
    experience: z.enum(["noExp", "1-3", "3-6", "6-plus"]).optional(),
    salaryFrom: z.coerce.number().int().min(0).optional(),
    salaryTo: z.coerce.number().int().min(0).optional(),
    salaryOnly: z.enum(["true", "false"]).optional(),
    remoteOnly: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(0).default(0),
  });

  it("should accept valid parameters", () => {
    const result = QueryParamsSchema.parse({
      text: "React",
      city: "Moscow",
      experience: "3-6",
      salaryFrom: 100000,
      salaryTo: 200000,
      salaryOnly: "true",
      remoteOnly: "false",
      page: 0,
    });

    expect(result).toEqual({
      text: "React",
      city: "Moscow",
      experience: "3-6",
      salaryFrom: 100000,
      salaryTo: 200000,
      salaryOnly: "true",
      remoteOnly: "false",
      page: 0,
    });
  });

  it("should accept empty parameters", () => {
    const result = QueryParamsSchema.parse({});

    expect(result).toEqual({
      page: 0,
    });
  });

  it("should coerce string numbers to numbers", () => {
    const result = QueryParamsSchema.parse({
      salaryFrom: "100000",
      salaryTo: "200000",
      page: "5",
    });

    expect(result.salaryFrom).toBe(100000);
    expect(result.salaryTo).toBe(200000);
    expect(result.page).toBe(5);
  });

  it("should reject invalid experience levels", () => {
    expect(() => {
      QueryParamsSchema.parse({
        experience: "invalid",
      });
    }).toThrow();
  });

  it("should reject invalid salary values", () => {
    expect(() => {
      QueryParamsSchema.parse({
        salaryFrom: -100,
      });
    }).toThrow();
  });

  it("should reject invalid page numbers", () => {
    expect(() => {
      QueryParamsSchema.parse({
        page: -1,
      });
    }).toThrow();
  });

  it("should reject invalid salaryOnly values", () => {
    expect(() => {
      QueryParamsSchema.parse({
        salaryOnly: "maybe",
      });
    }).toThrow();
  });

  it("should accept valid salaryOnly and remoteOnly values", () => {
    const result = QueryParamsSchema.parse({
      salaryOnly: "true",
      remoteOnly: "false",
    });

    expect(result.salaryOnly).toBe("true");
    expect(result.remoteOnly).toBe("false");
  });
});

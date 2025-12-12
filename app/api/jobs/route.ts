import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hhClient, ExperienceLevel, type JobSearchParams } from "@/lib/hh";
import { HttpError } from "@/lib/errors";

const QueryParamsSchema = z.object({
  text: z.string().optional(),
  city: z.string().optional(),
  experience: z.enum([
    ExperienceLevel.NoExperience,
    ExperienceLevel.OneTo3,
    ExperienceLevel.ThreeTo6,
    ExperienceLevel.SixPlus,
  ]).optional(),
  salaryFrom: z.coerce.number().int().min(0).optional(),
  salaryTo: z.coerce.number().int().min(0).optional(),
  salaryOnly: z.enum(["true", "false"]).optional(),
  remoteOnly: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(0).default(0),
});

type QueryParams = z.infer<typeof QueryParamsSchema>;

function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const raw = {
    text: searchParams.get("text") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    experience: searchParams.get("experience") ?? undefined,
    salaryFrom: searchParams.get("salaryFrom") ?? undefined,
    salaryTo: searchParams.get("salaryTo") ?? undefined,
    salaryOnly: searchParams.get("salaryOnly") ?? undefined,
    remoteOnly: searchParams.get("remoteOnly") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  };

  return QueryParamsSchema.parse(raw);
}

export async function GET(request: NextRequest) {
  try {
    const parsed = parseQueryParams(request.nextUrl.searchParams);

    const searchParams: JobSearchParams = {
      text: parsed.text,
      city: parsed.city,
      experience: parsed.experience,
      salaryFrom: parsed.salaryFrom,
      salaryTo: parsed.salaryTo,
      salaryOnly: parsed.salaryOnly === "true",
      remoteOnly: parsed.remoteOnly === "true",
      page: parsed.page,
    };

    const result = await hhClient.search(searchParams);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    if (error instanceof HttpError) {
      return NextResponse.json(
        {
          error: error.message,
          status: error.status,
        },
        { status: Math.min(error.status, 500) },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "An unknown error occurred",
      },
      { status: 500 },
    );
  }
}

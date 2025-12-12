import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { searchJobs } from "@/features/jobs";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  salaryMax: z.coerce.number().int().nonnegative().optional(),
  experience: z.enum(["noExperience", "between1And3", "between3And6", "moreThan6"]).optional(),
  remote: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

type ErrorBody = {
  error: string;
  message: string;
  details?: unknown;
};

function jsonError(status: number, body: ErrorBody) {
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return jsonError(400, {
      error: "INVALID_QUERY",
      message: "Invalid query parameters",
      details: parsed.error.flatten(),
    });
  }

  const cursorRaw = parsed.data.cursor;
  const offset = cursorRaw ? Number.parseInt(cursorRaw, 10) : 0;

  if (!Number.isFinite(offset) || offset < 0) {
    return jsonError(400, {
      error: "INVALID_CURSOR",
      message: "cursor must be a non-negative integer",
      details: { cursor: cursorRaw },
    });
  }

  try {
    const result = await searchJobs(
      {
        keyword: parsed.data.q,
        city: parsed.data.city,
        salaryMin: parsed.data.salaryMin,
        salaryMax: parsed.data.salaryMax,
        experience: parsed.data.experience,
        remoteOnly: parsed.data.remote,
      },
      { offset, limit: parsed.data.limit },
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return jsonError(500, {
      error: "SEARCH_FAILED",
      message: `Failed to search jobs: ${message}`,
    });
  }
}

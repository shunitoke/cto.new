import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { analyzeVacancyDescription } from "@/features/analyzer";
import { isHttpError } from "@/lib/errors";
import { getVacancyDescriptionById } from "@/features/analyzer/vacancy-lookup";
import { isAnalyzerError } from "@/features/analyzer/errors";

export const runtime = "nodejs";

const analyzeRequestSchema = z
  .object({
    id: z.union([z.string().min(1), z.number().int()]).optional(),
    description: z.string().min(1).optional(),
    vacancy: z
      .object({
        id: z.union([z.string().min(1), z.number().int()]).optional(),
        description: z.string().min(1),
      })
      .optional(),
  })
  .refine((data) => data.description || data.vacancy?.description || data.id, {
    message: "Expected either 'description'/'vacancy.description' or 'id'",
  });

type ErrorBody = {
  error: string;
  message: string;
  details?: unknown;
};

function jsonError(status: number, body: ErrorBody) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return jsonError(400, {
      error: "INVALID_JSON",
      message: "Request body must be valid JSON",
    });
  }

  const parsed = analyzeRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError(400, {
      error: "INVALID_REQUEST",
      message: "Invalid request payload",
      details: parsed.error.flatten(),
    });
  }

  const id = parsed.data.vacancy?.id ?? parsed.data.id;
  const descriptionFromPayload = parsed.data.vacancy?.description ?? parsed.data.description;

  let description = descriptionFromPayload;

  if (!description && id !== undefined) {
    const idStr = String(id);

    try {
      const lookedUp = await getVacancyDescriptionById(idStr);
      if (lookedUp) description = lookedUp;
    } catch (error) {
      return jsonError(503, {
        error: "REDIS_ERROR",
        message: "Failed to read vacancy from Redis",
        details: error instanceof Error ? error.message : error,
      });
    }

    if (!description) {
      return jsonError(404, {
        error: "VACANCY_NOT_FOUND",
        message: "Vacancy not found by id (provide description or store vacancy in Redis)",
        details: { id: idStr },
      });
    }
  }

  try {
    const result = await analyzeVacancyDescription(description ?? "");

    return NextResponse.json({
      id: id === undefined ? null : String(id),
      descriptionHash: result.descriptionHash,
      cached: result.cached,
      score: result.analysis.compatibilityScore,
      rationale: result.analysis.explanation,
      analysis: result.analysis,
    });
  } catch (error) {
    if (isHttpError(error)) {
      const rateLimited = error.status === 429;

      return jsonError(rateLimited ? 503 : 502, {
        error: rateLimited ? "OPENROUTER_RATE_LIMIT" : "UPSTREAM_HTTP_ERROR",
        message: `Upstream request failed (status ${error.status})`,
        details: { url: error.url, status: error.status, body: error.body },
      });
    }

    if (isAnalyzerError(error)) {
      return jsonError(error.status, {
        error: error.code,
        message: error.message,
        details: error.cause instanceof Error ? error.cause.message : error.cause,
      });
    }

    return jsonError(500, {
      error: "INTERNAL_ERROR",
      message: "Unexpected error",
      details: error instanceof Error ? error.message : error,
    });
  }
}

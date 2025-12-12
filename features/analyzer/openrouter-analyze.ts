import "server-only";

import { openRouterChatCompletion } from "@/lib/openrouter";
import { buildVacancyAnalysisMessages } from "@/features/analyzer/prompt";
import {
  llmVacancyAnalysisSchema,
  type LlmVacancyAnalysis,
} from "@/features/analyzer/schema";
import { env } from "@/lib/env";
import { AnalyzerError } from "@/features/analyzer/errors";

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";

function extractJsonObject(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    const withoutFence = trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "");
    return extractJsonObject(withoutFence);
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AnalyzerError(
      "LLM response does not contain a JSON object",
      502,
      "OPENROUTER_BAD_RESPONSE",
    );
  }

  return trimmed.slice(start, end + 1);
}

export async function analyzeVacancyWithOpenRouter(
  description: string,
): Promise<LlmVacancyAnalysis> {
  const response = await openRouterChatCompletion(
    {
      model: env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL,
      temperature: 0,
      max_tokens: 600,
      messages: buildVacancyAnalysisMessages(description),
    },
    { retries: 2, timeoutMs: 45_000 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new AnalyzerError(
      "OpenRouter returned an empty response",
      502,
      "OPENROUTER_BAD_RESPONSE",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(content));
  } catch (error) {
    throw new AnalyzerError("Failed to parse LLM JSON response", 502, "OPENROUTER_BAD_RESPONSE", {
      cause: error,
    });
  }

  const validated = llmVacancyAnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AnalyzerError(
      "LLM JSON response does not match the expected schema",
      502,
      "OPENROUTER_BAD_RESPONSE",
      {
        cause: validated.error,
      },
    );
  }

  return validated.data;
}

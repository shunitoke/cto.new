import "server-only";

import { HttpError } from "@/lib/errors";
import { fetchJson } from "@/lib/http";
import { withRetry } from "@/lib/retry";
import { env } from "@/lib/env";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type OpenRouterChatCompletionRequest = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
};

export type OpenRouterChatCompletionResponse = {
  id: string;
  choices: Array<{
    index: number;
    message: OpenRouterMessage;
    finish_reason: string | null;
  }>;
};

function isRetryableOpenRouterError(error: unknown): boolean {
  if (!(error instanceof HttpError)) return false;

  if (error.status === 408) return true;
  if (error.status === 429) return true;
  if (error.status >= 500) return true;

  return false;
}

export async function openRouterChatCompletion(
  request: OpenRouterChatCompletionRequest,
  options?: { retries?: number; timeoutMs?: number },
): Promise<OpenRouterChatCompletionResponse> {
  return await withRetry(
    async () => {
      return await fetchJson<OpenRouterChatCompletionResponse>(
        new URL("/chat/completions", OPENROUTER_BASE_URL),
        {
          method: "POST",
          timeoutMs: options?.timeoutMs ?? 30_000,
          body: request,
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          },
        },
      );
    },
    {
      retries: options?.retries ?? 3,
      shouldRetry: isRetryableOpenRouterError,
    },
  );
}

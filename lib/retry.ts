import { AppError } from "@/lib/errors";

export type RetryOptions = {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  {
    retries = 3,
    minDelayMs = 250,
    maxDelayMs = 5_000,
    factor = 2,
    jitter = true,
    shouldRetry,
    onRetry,
  }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      const retryable = shouldRetry ? shouldRetry(error) : true;
      const isLastAttempt = attempt >= retries + 1;
      if (!retryable || isLastAttempt) break;

      const baseDelay = Math.min(maxDelayMs, minDelayMs * factor ** (attempt - 1));
      const delay = jitter ? Math.round(baseDelay * (0.5 + Math.random())) : baseDelay;

      onRetry?.(error, attempt, delay);
      await sleep(delay);
    }
  }

  throw new AppError("Retry attempts exhausted", { cause: lastError });
}

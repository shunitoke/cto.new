import "server-only";

import { AppError } from "@/lib/errors";

export class AnalyzerError extends AppError {
  override name = "AnalyzerError";

  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

export function isAnalyzerError(error: unknown): error is AnalyzerError {
  return error instanceof AnalyzerError;
}

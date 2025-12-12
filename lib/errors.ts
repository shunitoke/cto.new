export class AppError extends Error {
  override name = "AppError";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
  }
}

export class HttpError extends AppError {
  override name = "HttpError";

  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
    public readonly body?: unknown,
  ) {
    super(message);
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

import { HttpError } from "@/lib/errors";

async function parseJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return await response.text();
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export type FetchJsonOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

export async function fetchJson<T>(
  input: string | URL,
  { timeoutMs, body, headers, ...init }: FetchJsonOptions = {},
): Promise<T> {
  const controller = timeoutMs ? new AbortController() : undefined;
  const timeout =
    timeoutMs && controller
      ? setTimeout(() => {
          controller.abort();
        }, timeoutMs)
      : undefined;

  try {
    const mergedHeaders = new Headers(headers);
    if (body !== undefined && !mergedHeaders.has("content-type")) {
      mergedHeaders.set("content-type", "application/json");
    }

    const response = await fetch(input, {
      ...init,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: mergedHeaders,
      signal: controller?.signal ?? init.signal,
    });

    if (!response.ok) {
      const parsed = await parseJsonSafely(response);
      throw new HttpError(
        `Request failed with status ${response.status}`,
        response.status,
        response.url,
        parsed,
      );
    }

    return (await response.json()) as T;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

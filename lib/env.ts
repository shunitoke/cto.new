import "server-only";

import { z } from "zod";

const envSchema = z.object({
  HH_API_TOKEN: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_MODEL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("\n");
}

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${formatZodErrors(parsed.error)}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    const resolved = getEnv();
    return (resolved as Record<PropertyKey, unknown>)[prop];
  },
}) as Env;

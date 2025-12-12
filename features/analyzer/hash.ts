import "server-only";

import crypto from "node:crypto";

export function normalizeVacancyDescription(description: string): string {
  return description.trim().replace(/\s+/g, " ");
}

export function hashVacancyDescription(description: string): string {
  const normalized = normalizeVacancyDescription(description);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

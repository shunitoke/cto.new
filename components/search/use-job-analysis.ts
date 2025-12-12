"use client";

import useSWR from "swr";

import { fetchJson } from "@/lib/http";
import type { AnalyzeResponse, Job } from "@/components/search/types";

export function useJobAnalysis(job: Job | null, enabled: boolean) {
  return useSWR<AnalyzeResponse>(
    job && enabled ? ["analyze", job.id] : null,
    async () => {
      if (!job) throw new Error("Job is required");
      return await fetchJson<AnalyzeResponse>("/api/analyze", {
        method: "POST",
        body: {
          vacancy: {
            id: job.id,
            description: job.description,
          },
        },
      });
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 60_000,
    },
  );
}

"use client";

import * as React from "react";
import { Building2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/components/search/types";
import { formatExperience, formatSalary } from "@/components/search/format";
import { useInView } from "@/components/search/use-in-view";
import { useJobAnalysis } from "@/components/search/use-job-analysis";
import { cn } from "@/lib/utils";

function scoreVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 75) return "success";
  if (score >= 45) return "warning";
  return "destructive";
}

export function JobCard({
  job,
  onSelect,
  selected,
}: {
  job: Job;
  selected: boolean;
  onSelect: (job: Job) => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "250px" });
  const analysis = useJobAnalysis(job, inView);

  return (
    <div ref={ref}>
      <Card
        className={cn(
          "cursor-pointer p-4 transition-colors hover:bg-accent/50",
          selected && "border-primary",
        )}
        onClick={() => onSelect(job)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSelect(job);
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{job.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.remote ? "Remote" : job.city}
              </span>
              <span>{formatExperience(job.experience)}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            {analysis.isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : analysis.error ? (
              <Badge variant="outline">No score</Badge>
            ) : analysis.data ? (
              <Badge variant={scoreVariant(analysis.data.score)}>
                {Math.round(analysis.data.score)}%
              </Badge>
            ) : (
              <Badge variant="outline">—</Badge>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">{formatSalary(job)}</div>
          <div className="flex flex-wrap gap-1">
            {job.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="whitespace-nowrap">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

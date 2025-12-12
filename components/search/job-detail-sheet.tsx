"use client";

import * as React from "react";
import { Building2, MapPin, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Job } from "@/components/search/types";
import { formatExperience, formatSalary } from "@/components/search/format";
import { useJobAnalysis } from "@/components/search/use-job-analysis";

function scoreVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 75) return "success";
  if (score >= 45) return "warning";
  return "destructive";
}

export function JobDetailSheet({
  job,
  open,
  onOpenChange,
}: {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const analysis = useJobAnalysis(job, open);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[min(640px,100vw)] flex-col">
        <SheetHeader className="flex-row items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <SheetTitle className="truncate">{job?.title ?? ""}</SheetTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job?.company}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job?.remote ? "Remote" : job?.city}
              </span>
              {job ? <span>{formatExperience(job.experience)}</span> : null}
            </div>
          </div>

          <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}>
            <X />
          </Button>
        </SheetHeader>

        <SheetBody className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {job ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{formatSalary(job)}</Badge>
              {job.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              {analysis.data ? (
                <Badge variant={scoreVariant(analysis.data.score)}>
                  Compatibility: {Math.round(analysis.data.score)}%
                </Badge>
              ) : null}
            </div>
          ) : null}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Description</h3>
            <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
              {job?.description}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Why it fits / doesn’t</h3>
            {analysis.isLoading ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                Analyzing…
              </div>
            ) : analysis.error ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                Could not load explanation.
              </div>
            ) : analysis.data ? (
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
                {analysis.data.rationale}
              </pre>
            ) : (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                Select a job to see details.
              </div>
            )}
          </section>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

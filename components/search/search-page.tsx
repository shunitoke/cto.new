"use client";

import * as React from "react";
import useSWRInfinite from "swr/infinite";
import { Filter, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchJson } from "@/lib/http";
import { FiltersPanel, type FiltersState } from "@/components/search/filters-panel";
import type { JobsResponse, Job } from "@/components/search/types";
import { JobCard } from "@/components/search/job-card";
import { useDebouncedValue } from "@/components/search/use-debounced-value";
import { useInView } from "@/components/search/use-in-view";
import { JobDetailSheet } from "@/components/search/job-detail-sheet";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AlertsManager } from "@/components/search/alerts-manager";

const PAGE_SIZE = 12;

const fallbackFacets = {
  cities: ["Remote", "Moscow", "Saint Petersburg", "Kazan"],
  salaryMin: 0,
  salaryMax: 650000,
};

function buildUrl(filters: FiltersState, facets: typeof fallbackFacets, cursor?: string | null) {
  const params = new URLSearchParams();
  params.set("limit", String(PAGE_SIZE));

  const keyword = filters.keyword.trim();
  if (keyword) params.set("q", keyword);

  const city = filters.city.trim();
  if (city) params.set("city", city);

  if (filters.experience !== "any") params.set("experience", filters.experience);
  if (filters.remoteOnly) params.set("remote", "true");

  if (filters.salary[0] > facets.salaryMin) params.set("salaryMin", String(filters.salary[0]));
  if (filters.salary[1] < facets.salaryMax) params.set("salaryMax", String(filters.salary[1]));

  if (cursor) params.set("cursor", cursor);

  return `/api/jobs?${params.toString()}`;
}

export default function SearchPage() {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);

  const [filters, setFilters] = React.useState<FiltersState>({
    keyword: "",
    city: "",
    salary: [fallbackFacets.salaryMin, fallbackFacets.salaryMax],
    experience: "any",
    remoteOnly: false,
  });

  const debouncedKeyword = useDebouncedValue(filters.keyword, 250);
  const debouncedCity = useDebouncedValue(filters.city, 250);

  const stableFilters = React.useMemo(
    () => ({ ...filters, keyword: debouncedKeyword, city: debouncedCity }),
    [filters, debouncedCity, debouncedKeyword],
  );

  const facetsFromDataRef = React.useRef<JobsResponse["facets"] | null>(null);

  const getKey = React.useCallback(
    (pageIndex: number, previousPageData: JobsResponse | null) => {
      if (previousPageData && !previousPageData.nextCursor) return null;

      const cursor = pageIndex === 0 ? null : previousPageData?.nextCursor;
      const facets = facetsFromDataRef.current ?? fallbackFacets;

      return buildUrl(stableFilters, facets, cursor);
    },
    [stableFilters],
  );

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate: mutateJobs,
  } = useSWRInfinite<JobsResponse>(getKey, (url: string) => fetchJson<JobsResponse>(url), {
    revalidateFirstPage: true,
    revalidateOnFocus: false,
  });

  const firstPage = data?.[0];
  const facets = firstPage?.facets ?? fallbackFacets;

  React.useEffect(() => {
    if (!firstPage) return;
    facetsFromDataRef.current = firstPage.facets;
  }, [firstPage]);

  const [salaryInitialized, setSalaryInitialized] = React.useState(false);
  React.useEffect(() => {
    if (salaryInitialized) return;
    if (!firstPage) return;

    setFilters((prev) => {
      const untouched =
        prev.salary[0] === fallbackFacets.salaryMin && prev.salary[1] === fallbackFacets.salaryMax;
      if (!untouched) return prev;

      return {
        ...prev,
        salary: [firstPage.facets.salaryMin, firstPage.facets.salaryMax],
      };
    });
    setSalaryInitialized(true);
  }, [firstPage, salaryInitialized]);

  React.useEffect(() => {
    setSize(1);
  }, [stableFilters, setSize]);

  const jobs = React.useMemo(() => data?.flatMap((page) => page.items) ?? [], [data]);

  const total = firstPage?.total ?? 0;
  const lastPage = data?.[data.length - 1];

  const isLoadingInitial = !data && !error;
  const isLoadingMore = isLoadingInitial || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isReachingEnd = lastPage ? lastPage.nextCursor === null : false;

  React.useEffect(() => {
    if (!selectedJob) return;
    if (jobs.some((j) => j.id === selectedJob.id)) return;
    setSelectedJob(null);
  }, [jobs, selectedJob]);

  const { ref: loadMoreRef, inView: loadMoreInView } = useInView<HTMLDivElement>({
    rootMargin: "600px",
  });

  React.useEffect(() => {
    if (!loadMoreInView) return;
    if (isLoadingMore) return;
    if (isReachingEnd) return;

    void setSize(size + 1);
  }, [isLoadingMore, isReachingEnd, loadMoreInView, setSize, size]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Search jobs</div>
            <div className="text-xs text-muted-foreground">Refine filters • scroll to load more</div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              onClick={() => void mutateJobs()}
              disabled={isValidating}
              className="hidden sm:inline-flex"
            >
              {isValidating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <Filter />
              Filters
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[340px_1fr]">
        <aside className="hidden lg:block">
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-3 text-sm font-semibold">Filters</div>
              <FiltersPanel value={filters} onChange={setFilters} facets={facets} />
            </div>
            <div className="rounded-lg border p-4">
              <AlertsManager filters={filters} facets={facets} />
            </div>
          </div>
        </aside>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              {isLoadingInitial ? (
                <span className="text-muted-foreground">Loading…</span>
              ) : error ? (
                <span className="text-destructive">Failed to load jobs</span>
              ) : (
                <span>
                  {total} job{total === 1 ? "" : "s"} • {jobs.length} shown
                </span>
              )}
            </div>

            {!isReachingEnd ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void setSize(size + 1)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? <Loader2 className="animate-spin" /> : null}
                Load more
              </Button>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-lg border bg-muted/30 p-6">
              <div className="text-sm font-semibold">Could not fetch jobs</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Try refreshing or adjusting your filters.
              </div>
              <Button className="mt-4" onClick={() => void mutateJobs()}>
                Retry
              </Button>
            </div>
          ) : null}

          {isLoadingInitial ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-24 w-full" />
              ))}
            </div>
          ) : null}

          {!isLoadingInitial && !error && jobs.length === 0 ? (
            <div className="rounded-lg border bg-muted/30 p-6 text-sm">
              <div className="font-semibold">No results</div>
              <div className="mt-1 text-muted-foreground">Try widening your filters.</div>
            </div>
          ) : null}

          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selectedJob?.id === job.id}
                onSelect={(j) => setSelectedJob(j)}
              />
            ))}

            {isLoadingMore ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-24 w-full" />
                ))}
              </div>
            ) : null}

            <div ref={loadMoreRef} className="h-10" />

            {isReachingEnd && jobs.length > 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                You’ve reached the end.
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Filters & Alerts</SheetTitle>
          </SheetHeader>
          <SheetBody className="overflow-y-auto space-y-6">
            <div>
              <div className="mb-3 text-sm font-semibold">Filters</div>
              <FiltersPanel value={filters} onChange={setFilters} facets={facets} />
            </div>
            <div>
              <AlertsManager filters={filters} facets={facets} />
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <JobDetailSheet
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => {
          if (!open) setSelectedJob(null);
        }}
      />

      {isValidating && !isLoadingInitial ? (
        <div className="fixed bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background px-3 py-2 text-xs shadow">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating results…
          </span>
        </div>
      ) : null}
    </div>
  );
}

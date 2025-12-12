"use client";

import * as React from "react";
import { Heart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/lib/favorites-context";
import { JobDetailSheet } from "@/components/search/job-detail-sheet";
import { formatExperience, formatSalary } from "@/components/search/format";
import type { Job } from "@/components/search/types";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);

  const handleRemoveFavorite = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(jobId);
    if (selectedJob?.id === jobId) {
      setSelectedJob(null);
    }
  };

  const handleClearAll = () => {
    clearFavorites();
    setSelectedJob(null);
  };

  const convertToJob = (favorite: {
    id: string;
    title: string;
    company: string;
    city: string;
    remote: boolean;
    experience: "intern" | "junior" | "mid" | "senior" | "lead";
    salaryMin: number | null;
    salaryMax: number | null;
    currency: "RUB" | "USD" | "EUR";
    tags: string[];
  }): Job => ({
    id: favorite.id,
    title: favorite.title,
    company: favorite.company,
    city: favorite.city,
    remote: favorite.remote,
    experience: favorite.experience,
    salaryMin: favorite.salaryMin,
    salaryMax: favorite.salaryMax,
    currency: favorite.currency,
    tags: favorite.tags,
    description: "", // Favorites don't store full descriptions
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Favorite jobs</div>
            <div className="text-xs text-muted-foreground">
              {favorites.length} saved job{favorites.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-lg font-semibold mb-2">No favorites yet</div>
            <div className="text-sm text-muted-foreground max-w-md">
              Start exploring jobs and click the heart icon to save your favorites. 
              They&apos;ll appear here and persist across sessions.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => {
              const job = convertToJob(favorite);
              const isSelected = selectedJob?.id === favorite.id;

              return (
                <Card
                  key={favorite.id}
                  className={cn(
                    "cursor-pointer p-4 transition-colors hover:bg-accent/50",
                    isSelected && "border-primary"
                  )}
                  onClick={() => setSelectedJob(job)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedJob(job);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{favorite.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {favorite.company}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {favorite.remote ? "Remote" : favorite.city}
                        </span>
                        <span>{formatExperience(favorite.experience)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleRemoveFavorite(favorite.id, e)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {formatSalary({
                        salaryMin: favorite.salaryMin,
                        salaryMax: favorite.salaryMax,
                        currency: favorite.currency,
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {favorite.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="whitespace-nowrap">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Saved on {new Date(favorite.savedAt).toLocaleDateString()}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <JobDetailSheet
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => {
          if (!open) setSelectedJob(null);
        }}
      />
    </div>
  );
}
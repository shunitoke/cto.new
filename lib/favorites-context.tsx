"use client";

import * as React from "react";
import type { Job } from "@/components/search/types";

export type FavoriteJob = {
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
  savedAt: string;
};

export type FavoritesContextType = {
  favorites: FavoriteJob[];
  addFavorite: (job: Job) => void;
  removeFavorite: (jobId: string) => void;
  isFavorite: (jobId: string) => boolean;
  clearFavorites: () => void;
};

export const FavoritesContext = React.createContext<FavoritesContextType | null>(null);

function serializeJob(job: Job): FavoriteJob {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    city: job.city,
    remote: job.remote,
    experience: job.experience,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    tags: job.tags,
    savedAt: new Date().toISOString(),
  };
}

interface RawFavoriteData {
  id: string;
  title: string;
  company: string;
  city: string;
  remote: boolean;
  experience: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: "RUB" | "USD" | "EUR";
  tags: string[];
  savedAt: string;
}

function deserializeJob(data: unknown): FavoriteJob | null {
  try {
    const obj = data as RawFavoriteData;
    if (
      typeof obj?.id === "string" &&
      typeof obj?.title === "string" &&
      typeof obj?.company === "string" &&
      typeof obj?.city === "string" &&
      typeof obj?.remote === "boolean" &&
      typeof obj?.experience === "string" &&
      Array.isArray(obj?.tags) &&
      typeof obj?.savedAt === "string"
    ) {
      return {
        id: obj.id,
        title: obj.title,
        company: obj.company,
        city: obj.city,
        remote: obj.remote,
        experience: obj.experience as "intern" | "junior" | "mid" | "senior" | "lead",
        salaryMin: obj.salaryMin ?? null,
        salaryMax: obj.salaryMax ?? null,
        currency: obj.currency ?? "RUB",
        tags: obj.tags,
        savedAt: obj.savedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = React.useState<FavoriteJob[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("job-favorites");
      if (stored) {
        const parsed = JSON.parse(stored);
        const validFavorites = (Array.isArray(parsed) ? parsed : [])
          .map(deserializeJob)
          .filter(Boolean) as FavoriteJob[];
        setFavorites(validFavorites);
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage:", error);
      localStorage.removeItem("job-favorites");
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("job-favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error);
    }
  }, [favorites]);

  const addFavorite = React.useCallback((job: Job) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.id === job.id);
      if (exists) return prev;

      const serialized = serializeJob(job);
      return [serialized, ...prev];
    });
  }, []);

  const removeFavorite = React.useCallback((jobId: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== jobId));
  }, []);

  const isFavorite = React.useCallback((jobId: string) => {
    return favorites.some((fav) => fav.id === jobId);
  }, [favorites]);

  const clearFavorites = React.useCallback(() => {
    setFavorites([]);
  }, []);

  const value = React.useMemo(
    () => ({
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      clearFavorites,
    }),
    [favorites, addFavorite, removeFavorite, isFavorite, clearFavorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = React.useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
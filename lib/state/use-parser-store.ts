"use client";

import { create } from "zustand";

type ParserState = {
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;

  lastRunAt: string | null;
  setLastRunAt: (isoDate: string | null) => void;
};

export const useParserStore = create<ParserState>((set) => ({
  isRunning: false,
  setIsRunning: (isRunning) => set({ isRunning }),

  lastRunAt: null,
  setLastRunAt: (lastRunAt) => set({ lastRunAt }),
}));

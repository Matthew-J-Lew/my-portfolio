// components/projects/projectsStore.ts
"use client";

import { create } from "zustand";
import { projects } from "./projects";

/**
 * Tiny global store for the Projects section.
 * - `activeIndex` is the project currently shown in the gallery/details.
 * - `setActiveIndex` moves to a specific project by index.
 * - `setActiveBySlug` is handy for deep links like #automated-data-pipeline.
 */
interface State {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  setActiveBySlug: (slug: string) => void;
}

export const useProjectsStore = create<State>((set) => ({
  // default to the first project
  activeIndex: 0,

  // move by numeric index (used by gallery arrows, dots, etc.)
  setActiveIndex: (i) => set({ activeIndex: i }),

  // move by slug (used when reading/updating the URL hash)
  setActiveBySlug: (slug) => {
    const idx = projects.findIndex((p) => p.slug === slug);
    if (idx >= 0) set({ activeIndex: idx });
  },
}));

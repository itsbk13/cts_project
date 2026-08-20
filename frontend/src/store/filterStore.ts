"use client";

import { create } from "zustand";

// ============================================================
// Global filter store
// Filters persist across relevant pages.
// ============================================================

export interface FilterState {
  dateRange: { from: string; to: string } | null;
  region: string;         // "All" = no filter
  diagnosis: string;
  insurance: string;
  provider: string;
  newExisting: string;    // "All" | "New" | "Existing"
}

interface FilterActions {
  setDateRange: (range: FilterState["dateRange"]) => void;
  setRegion: (region: string) => void;
  setDiagnosis: (diagnosis: string) => void;
  setInsurance: (insurance: string) => void;
  setProvider: (provider: string) => void;
  setNewExisting: (value: string) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
}

const DEFAULT_FILTERS: FilterState = {
  dateRange: null,
  region: "All",
  diagnosis: "All",
  insurance: "All",
  provider: "All",
  newExisting: "All",
};

export const useFilterStore = create<FilterState & FilterActions>((set, get) => ({
  ...DEFAULT_FILTERS,

  setDateRange: (range) => set({ dateRange: range }),
  setRegion: (region) => set({ region }),
  setDiagnosis: (diagnosis) => set({ diagnosis }),
  setInsurance: (insurance) => set({ insurance }),
  setProvider: (provider) => set({ provider }),
  setNewExisting: (newExisting) => set({ newExisting }),

  resetFilters: () => set(DEFAULT_FILTERS),

  hasActiveFilters: () => {
    const s = get();
    return (
      s.dateRange !== null ||
      s.region !== "All" ||
      s.diagnosis !== "All" ||
      s.insurance !== "All" ||
      s.provider !== "All" ||
      s.newExisting !== "All"
    );
  },
}));

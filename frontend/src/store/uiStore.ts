"use client";

import { create } from "zustand";

// ============================================================
// UI state store
// Controls drawer and dataset modal visibility.
// ============================================================

export type DrawerType = "leakage" | "patientRisk" | null;

interface UIState {
  activeDrawer: DrawerType;
  selectedPatientId: string | null;
  selectedStage: string | null;
  isDatasetModalOpen: boolean;
  isMobileMenuOpen: boolean;
}

interface UIActions {
  openLeakageDrawer: (stage: string) => void;
  openPatientRiskDrawer: (patientId: string) => void;
  openDatasetModal: () => void;
  closeDatasetModal: () => void;
  closeDrawer: () => void;
  setSelectedStage: (stage: string | null) => void;
  setSelectedPatient: (patientId: string | null) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  activeDrawer: null,
  selectedPatientId: null,
  selectedStage: null,
  isDatasetModalOpen: false,
  isMobileMenuOpen: false,

  openLeakageDrawer: (stage) =>
    set({ activeDrawer: "leakage", selectedStage: stage }),

  openPatientRiskDrawer: (patientId) =>
    set({ activeDrawer: "patientRisk", selectedPatientId: patientId }),

  openDatasetModal: () =>
    set({ isDatasetModalOpen: true }),

  closeDatasetModal: () =>
    set({ isDatasetModalOpen: false }),

  closeDrawer: () =>
    set({ activeDrawer: null, selectedPatientId: null, selectedStage: null }),

  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setSelectedPatient: (patientId) => set({ selectedPatientId: patientId }),

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));

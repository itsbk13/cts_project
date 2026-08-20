import sys

content = '''"use client";

import { create } from "zustand";

import type {
  OverviewKPIs,
  FunnelData,
  CohortHeatmapCell,
  CohortComparison,
  LeakageDriver,
  StageLeakage,
  RegionalLeakage,
  LeakageDrawerData,
  SurvivalData,
  TrendPoint,
  OutcomeDistribution,
} from "@/types/analytics";

import type {
  RiskOverviewKPIs,
  RiskDistributionPoint,
  RiskPatient,
  PatientRiskDetail,
  GlobalSHAPImportance,
  PatientSHAPExplanation,
} from "@/types/risk";

export interface DatasetMetadata {
  filename: string;
  patient_count: number;
  column_count: number;
  status: string;
  last_updated: string;
  isCustom: boolean;
}

export interface DatasetState {
  metadata: DatasetMetadata;
  isLoading: boolean;
  error: string | null;

  // Analytics datasets
  overviewKPIs: OverviewKPIs;
  outcomeDistribution: OutcomeDistribution[];
  trend: TrendPoint[];
  funnelData: FunnelData;
  cohortHeatmap: CohortHeatmapCell[];
  cohortComparisons: CohortComparison[];
  leakageDrivers: LeakageDriver[];
  stageLeakage: StageLeakage[];
  regionalLeakage: RegionalLeakage[];
  survivalData: SurvivalData;
  riskKPIs: RiskOverviewKPIs;
  riskDistribution: RiskDistributionPoint[];
  riskPatients: RiskPatient[];
  globalSHAP: GlobalSHAPImportance[];

  // Actions
  uploadDataset: (file: File) => Promise<void>;
  resetToDefault: () => void;
  getPatientRiskDetail: (patientId: string) => PatientRiskDetail;
  getPatientSHAPExplanation: (patientId: string) => PatientSHAPExplanation;
  getLeakageDrawerData: (stage: string) => LeakageDrawerData;
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  metadata: {
    filename: "Databricks Connected",
    patient_count: 0,
    column_count: 24,
    status: "Live Database",
    last_updated: "Real-time",
    isCustom: true,
  },
  isLoading: false,
  error: null,

  overviewKPIs: { total_patients: 0, first_fill_rate: 0, dropoff_rate: 0, high_risk_active: 0, revenue_at_risk: 0 },
  outcomeDistribution: [],
  trend: [],
  funnelData: { stages: [], total_entered: 0, total_completed: 0, overall_conversion: 0 },
  cohortHeatmap: [],
  cohortComparisons: [],
  leakageDrivers: [],
  stageLeakage: [],
  regionalLeakage: [],
  survivalData: { curves: [], median_survival_days: 0, key_timepoints: [], groups: [] },
  riskKPIs: { active_patients: 0, high_risk: 0, medium_risk: 0, low_risk: 0 },
  riskDistribution: [],
  riskPatients: [],
  globalSHAP: [],

  resetToDefault: () => {
    set({
      metadata: {
        filename: "Databricks Connected",
        patient_count: 0,
        column_count: 24,
        status: "Live Database",
        last_updated: "Real-time",
        isCustom: true,
      }
    });
  },

  uploadDataset: async (file: File) => {
    // No-op for live connection
    console.log("Upload dataset disabled in Live mode.");
  },

  getPatientRiskDetail: (patientId: string) => ({
    patient_id: patientId,
    risk_score: 0,
    risk_category: "Low Risk",
    current_stage: "Diagnosis",
    days_in_current_stage: 0,
    risk_factors: [],
    journey_timeline: [],
    recommended_action: "",
    estimated_revenue_at_risk: 0,
  }),

  getPatientSHAPExplanation: (patientId: string) => ({
    patient_id: patientId,
    base_value: 0,
    predicted_risk: 0,
    features: [],
    plain_english_summary: ""
  }),

  getLeakageDrawerData: (stage: string) => ({
    stage,
    dropoff_count: 0,
    dropoff_rate: 0,
    revenue_impact: 0,
    historical_benchmark: 0,
    top_reasons: [],
    recommended_actions: [],
    affected_patients: []
  }),
}));
'''

with open('src/store/datasetStore.ts', 'w') as f:
    f.write(content)

print("datasetStore.ts rewritten successfully.")

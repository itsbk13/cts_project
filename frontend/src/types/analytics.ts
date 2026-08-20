// ============================================================
// Analytics types — funnel, cohort, leakage, survival
// ============================================================

import type { JourneyStage } from "./patient";

// ── Overview ─────────────────────────────────────────────────

export interface OverviewKPIs {
  total_patients: number;
  first_fill_rate: number;       // %
  dropoff_rate: number;          // %
  high_risk_active: number;
  revenue_at_risk: number;       // USD
}

// ── Funnel ───────────────────────────────────────────────────

export interface FunnelStage {
  stage: JourneyStage;
  patient_count: number;
  conversion_rate: number;       // % entering this stage from previous
  dropoff_rate: number;          // % who drop at this stage
  dropoff_count: number;
  average_time_days: number | null;
}

export interface FunnelData {
  stages: FunnelStage[];
  total_entered: number;
  total_completed: number;
  overall_conversion: number;
}

// ── Cohort ───────────────────────────────────────────────────

export interface Cohort {
  cohort: string;
  region: string;
  patient_count: number;
  dropoff_rate: number;
  first_fill_rate: number;
  diagnosis_month: string;
}

export interface CohortHeatmapCell {
  cohort_month: string;
  total_patients: number;
  retention_rates: (number | null)[];
}

export interface CohortComparison {
  label: string;
  patient_count: number;
  first_fill_rate: number;
  dropoff_rate: number;
  avg_days_to_fill: number | null;
}

// ── Leakage ──────────────────────────────────────────────────

export interface LeakageDriver {
  driver: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  affected_patients: number;
  confidence: number;            // 0–1
  hazard_ratio?: number;
  p_value?: number;
  confidence_interval?: [number, number];
  effect_size?: number;
  stage: JourneyStage;
}

export interface StageLeakage {
  stage: JourneyStage;
  dropoff_rate: number;
  dropoff_count: number;
  top_driver: string;
  revenue_at_risk: number;
}

export interface RegionalLeakage {
  region: string;
  dropoff_rate: number;
  patient_count: number;
  revenue_at_risk: number;
}

export interface LeakageDrawerData {
  stage: JourneyStage | string;
  patients_affected: number;
  dropoff_rate: number;
  avg_stage_duration_days: number;
  top_regions: RegionalLeakage[];
  top_cohorts: CohortComparison[];
  top_drivers: LeakageDriver[];
  revenue_at_risk: number;
  recommended_action: string;
}

// ── Survival ─────────────────────────────────────────────────

export interface SurvivalPoint {
  time: number;                  // days
  survival_probability: number;  // 0–1
  group: string;
  at_risk?: number;
  events?: number;
}

export interface SurvivalData {
  curves: SurvivalPoint[];
  median_survival_days: number;
  key_timepoints: {
    days: number;
    probability: number;
    label: string;
  }[];
  groups: string[];
}

// ── Trend ────────────────────────────────────────────────────

export interface TrendPoint {
  period: string;                // e.g. "Jan 2024"
  dropoff_rate: number;
  first_fill_rate: number;
  patient_count: number;
}

// ── Outcome ──────────────────────────────────────────────────

export interface OutcomeDistribution {
  outcome: string;
  count: number;
  percentage: number;
}

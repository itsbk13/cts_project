// ============================================================
// Risk & SHAP types
// ============================================================

import type { JourneyStage, RiskCategory, PatientJourneyTimeline } from "./patient";

// ── Risk Overview ────────────────────────────────────────────

export interface RiskOverviewKPIs {
  active_patients: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
}

// ── Risk Distribution ────────────────────────────────────────

export interface RiskDistributionPoint {
  category: RiskCategory;
  count: number;
  percentage: number;
}

// ── Risk Patient (for table) ─────────────────────────────────

export interface RiskPatient {
  patient_id: string;
  last_updated?: string;
  current_stage: JourneyStage;
  days_in_current_stage: number;
  risk_score: number;           // 0–100
  risk_category: RiskCategory;
  top_risk_driver: string;
  region: string;
  insurance_type: string;
}

// ── Patient Risk Detail (for drawer) ─────────────────────────

export interface PatientRiskDetail {
  patient_id: string;
  last_updated?: string;
  risk_score: number;
  risk_category: RiskCategory;
  current_stage: JourneyStage;
  days_in_current_stage: number;
  risk_factors: {
    name: string;
    contribution: number;
    description: string;
  }[];
  journey_timeline: PatientJourneyTimeline[];
  recommended_action: string;
  estimated_revenue_at_risk: number;
}

// ── SHAP ─────────────────────────────────────────────────────

export interface SHAPFeature {
  feature: string;
  contribution: number;           // positive = increases risk, negative = decreases
  direction: "positive" | "negative";
  display_value?: string;
}

export interface GlobalSHAPImportance {
  feature: string;
  mean_abs_shap: number;          // global importance magnitude
  rank: number;
}

export interface PatientSHAPExplanation {
  patient_id: string;
  last_updated?: string;
  base_value: number;
  predicted_risk: number;
  features: SHAPFeature[];
  plain_english_summary: string;
}

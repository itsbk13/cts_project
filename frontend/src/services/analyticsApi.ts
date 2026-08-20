// ============================================================
// Analytics API Service — Patient Journey Intelligence
// Calls the FastAPI backend to get real analytics derived
// from registered patients stored in Databricks.
//
// Backend contract (FastAPI):
//   GET /api/analytics          → Overview + funnel + leakage (real)
//   GET /api/patients           → Patient list with ML risk scores
//
// Configure via environment:
//   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
// ============================================================

import { getCurrentUser } from "@/lib/auth";
import type { RiskPatient } from "@/types/risk";
import type { PatientListItem } from "@/types/patient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ——— Internal helpers ————————————————————————————————

async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const session = getCurrentUser();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    } else if (session?.hospitalId) {
      headers["Authorization"] = `Bearer ${session.hospitalId}`;
    } else {
      headers["Authorization"] = `Bearer hosp_335078`;
    }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: "GET", headers });
  } catch {
    throw new Error("Unable to connect to the service. Please try again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : undefined;
    throw new Error(detail ?? "An unexpected error occurred.");
  }
  return data as TResponse;
}

// ——— Analytics API ————————————————————————————————————

export interface BackendAnalytics {
  overview: {
    total_patients: number;
    active_journeys: number;
    conversion_rate: number;
    avg_time_to_fill: number;
    revenue_at_risk: number;
  };
  funnel: {
    funnel_stages: string[];
    patient_counts: number[];
    conversion_rates: number[];
    dropoff_rates: number[];
    avg_days_in_stage: number[];
  };
  stage_leakage: Array<{
    stage: string;
    dropoff_count: number;
    dropoff_rate: number;
    revenue_at_risk: number;
  }>;
  cohorts?: {
    heatmap: import("@/types/analytics").CohortHeatmapCell[];
    comparisons: Array<{ label: string; patient_count: number; first_fill_rate: number; avg_time_to_fill: number }>;
  };
  leakage?: {
    drivers: Array<{ rank: number; factor: string; description: string; impact: string; affected_patients: number }>;
    stageLeakage: Array<{ stage: string; dropoff_count: number; dropoff_rate: number; revenue_at_risk: number }>;
    regionalLeakage: Array<{ region: string; dropoff_rate: number; patient_count: number; revenue_at_risk: number }>;
  };
  survival?: {
    curves: Array<{ time: number; survival_probability: number; group: string }>;
    median_survival_days: number;
    key_timepoints: Array<{ days: number; probability: number; label: string }>;
    groups: string[];
  };
}

/** Fetch real analytics computed from Databricks patients + events */
export async function getBackendAnalytics(): Promise<BackendAnalytics> {
  return apiGet<BackendAnalytics>("/api/analytics");
}

/** Convert a PatientListItem (from /api/patients) to RiskPatient for the risk page */
function toRiskPatient(p: any): RiskPatient {
  return {
    patient_id: String(p.patient_id),
    current_stage: (p.current_stage ?? "Diagnosis") as RiskPatient["current_stage"],
    days_in_current_stage: typeof p.days_in_current_stage === "number" ? p.days_in_current_stage : 0,
    risk_score: typeof p.risk_score === "number" ? p.risk_score : 0,
    risk_category: (p.risk_level === "HIGH" ? "HIGH" : "LOW") as RiskPatient["risk_category"],
    top_risk_driver: p.top_risk_driver || "Baseline Risk",
    region: p.region ?? "",
    insurance_type: p.insurance ?? "",
  };
}

/**
 * Get RiskPatient list from the real patient database.
 * Falls back to empty array when no patients registered.
 */
export async function getBackendRiskPatients(): Promise<RiskPatient[]> {
  try {
    const patients = await apiGet<PatientListItem[]>("/api/patients");
    if (!Array.isArray(patients) || patients.length === 0) return [];
    return patients.map(toRiskPatient);
  } catch {
    return [];
  }
}

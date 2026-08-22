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
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

// ——— Internal helpers ————————————————————————————————

const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // Cache for 1 hour to ensure instant page loads

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

  const cacheKey = `${headers["Authorization"] || "default"}_${path}`;
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as TResponse;
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
  
  apiCache.set(cacheKey, { data, timestamp: Date.now() });
  return data as TResponse;
}

// ——— Analytics API ————————————————————————————————————

let _cachedAnalytics: BackendAnalytics | null = null;
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
    risk_category: (p.risk_level === "HIGH" ? "HIGH" : p.risk_level === "MEDIUM" ? "MEDIUM" : "LOW") as RiskPatient["risk_category"],
    top_risk_driver: p.top_risk_driver || "Baseline Risk",
    region: p.region ?? "",
    insurance_type: p.insurance ?? "",
  };
}

/**
 * Get RiskPatient list from the real patient database.
 * Falls back to empty data when no patients registered.
 */
export async function getBackendRiskPatients(params: {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  min_score?: number;
  risk_category?: string;
  sort_field?: string;
  sort_dir?: string;
  region?: string;
  insurance?: string;
} = {}): Promise<{ data: RiskPatient[], total: number }> {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.search) queryParams.append("search", params.search);
    if (params.stage) queryParams.append("stage", params.stage);
    if (params.min_score) queryParams.append("min_score", String(params.min_score));
    if (params.risk_category) queryParams.append("risk_category", params.risk_category);
    if (params.sort_field) queryParams.append("sort_field", params.sort_field);
    if (params.sort_dir) queryParams.append("sort_dir", params.sort_dir);
    if (params.region) queryParams.append("region", params.region);
    if (params.insurance) queryParams.append("insurance", params.insurance);

    const qs = queryParams.toString();
    const endpoint = `/api/patients${qs ? "?" + qs : ""}`;

    const res = await apiGet<any>(endpoint);
    if (res && Array.isArray(res.data)) {
      return { data: res.data.map(toRiskPatient), total: res.total || 0 };
    }
    // Fallback if older API format
    if (Array.isArray(res)) {
      return { data: res.map(toRiskPatient), total: res.length };
    }
    return { data: [], total: 0 };
  } catch (err) {
    console.error(err);
    return { data: [], total: 0 };
  }
}

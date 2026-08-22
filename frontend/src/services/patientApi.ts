// ============================================================
// Patient API Service — Patient Journey Intelligence
// Centralized patient data backend integration.
//
// Backend contract (FastAPI):
//   POST /api/v1/patients              → Register patient
//   GET  /api/v1/patients/{patient_id} → Get patient detail
//   GET  /api/v1/patients              → List patients
//
// In demo mode (NEXT_PUBLIC_DEMO_AUTH=true):
//   Falls back to centralized mock data — no backend call made.
//
// Configure via environment:
//   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
// ============================================================

import type {
  PatientRegistration,
  PatientRegistrationResponse,
  PatientDetail,
  PatientListItem,
} from "@/types/patient";

import {
  mockPatientList,
  mockPatientDetail,
  generateMockPatientDetail,
} from "@/lib/patientMockData";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_AUTH === "true";

const delay = (ms = 120) => new Promise<void>((res) => setTimeout(res, ms));

// ── Internal Helper ────────────────────────────────────────────

import { getCurrentUser } from "@/lib/auth";

async function apiPost<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const session = getCurrentUser();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Unable to connect to the service. Please try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      typeof data.detail === "string" ? data.detail : undefined;
    throw new Error(detail ?? "An unexpected error occurred.");
  }
  return data as TResponse;
}

async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const session = getCurrentUser();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers,
    });
  } catch {
    throw new Error("Unable to connect to the service. Please try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      typeof data.detail === "string" ? data.detail : undefined;
    throw new Error(detail ?? "An unexpected error occurred.");
  }
  return data as TResponse;
}

// ── Patient API Functions ──────────────────────────────────────

/**
 * Register a new patient in the system.
 * In demo mode: returns a mock response after a short delay.
 */
export async function registerPatient(
  data: PatientRegistration
): Promise<PatientRegistrationResponse> {
  // Map frontend lowercase keys → backend uppercase keys (Databricks schema)
  const payload = {
    Patient_ID:          data.patient_id,
    Age:                 data.age,
    Region:              data.region,
    Diagnosis:           data.diagnosis,
    Therapy:             data.therapy,
    Insurance_Type:      data.insurance,
    Copay_Amount:        data.copay_amount,
    Prior_Authorization: 0,
  };
  return apiPost<object, PatientRegistrationResponse>(
    "/api/patients",
    payload
  );
}

/**
 * Get a patient's full detail including journey timeline and events.
 * In demo mode: returns centralized mock data.
 */
export async function getPatient(patientId: string): Promise<PatientDetail> {
  const res = await apiGet<PatientDetail>(`/api/patients/${patientId}`);
  if (res && res.patient_id) return res;
  throw new Error("Patient not found.");
}

/**
 * Get the list of registered patients for this hospital.
 * In demo mode: returns centralized mock patient list.
 */
export async function getPatientList(params: {
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
} = {}): Promise<{ data: PatientListItem[]; total: number }> {
  
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
    return { data: res.data, total: res.total || 0 };
  }
  if (Array.isArray(res)) {
    return { data: res, total: res.length };
  }
  
  throw new Error("Failed to fetch patient list");
}

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
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_AUTH === "true" ||
  process.env.NEXT_PUBLIC_DEMO_AUTH === undefined ||
  process.env.NEXT_PUBLIC_DEMO_AUTH === "";

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
  if (isDemoMode) {
    await delay(600);
    return {
      patient_id: data.patient_id,
      message: "Patient registered successfully.",
    };
  }
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
  if (isDemoMode) {
    await delay(300);
    if (patientId === "PT-10001") {
      return mockPatientDetail;
    }
    return generateMockPatientDetail(patientId);
  }
  return apiGet<PatientDetail>(`/api/patients/${patientId}`);
}

/**
 * Get the list of registered patients for this hospital.
 * In demo mode: returns centralized mock patient list.
 */
export async function getPatientList(): Promise<PatientListItem[]> {
  if (isDemoMode) {
    await delay(200);
    return mockPatientList;
  }
  return apiGet<PatientListItem[]>("/api/patients");
}

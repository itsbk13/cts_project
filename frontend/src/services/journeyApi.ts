// ============================================================
// Journey API Service — Patient Journey Intelligence
// Centralized journey event & risk score backend integration.
//
// Backend contract (FastAPI):
//   POST /api/v1/patients/score              → Instant risk prediction
//   POST /api/v1/patients/{id}/events        → Save journey event
//   GET  /api/v1/patients/{id}/events        → Get patient events
//
// In demo mode (NEXT_PUBLIC_DEMO_AUTH=true):
//   Falls back to centralized mock data — no backend call made.
//
// IMPORTANT:
//   The frontend never calculates the ML risk score.
//   It only sends form data to FastAPI and displays the result.
//
// Configure via environment:
//   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
// ============================================================

import type {
  JourneyEventForm,
  JourneyEvent,
  SaveJourneyEventResponse,
  InstantRiskRequest,
  InstantRiskResponse,
  RiskCategory,
} from "@/types/patient";

import { mockPatientEvents, generateMockRiskScore } from "@/lib/patientMockData";

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

// ── Journey API Functions ──────────────────────────────────────

/**
 * Get instant ML risk score for a patient's current event data.
 *
 * This is the critical real-time risk prediction endpoint.
 * The frontend sends form data → FastAPI runs the ML model → returns risk.
 * The frontend NEVER calculates the risk score itself.
 *
 * In demo mode: returns a heuristic mock score based on form data.
 */
export async function getInstantRiskScore(
  request: InstantRiskRequest
): Promise<InstantRiskResponse> {
  if (isDemoMode) {
    // Demo: simulate ML processing time
    await delay(1200);
    return generateMockRiskScore(request);
  }
  return apiPost<InstantRiskRequest, InstantRiskResponse>(
    "/api/patients/score",
    request
  );
}

/**
 * Save a patient's journey event to the backend.
 * Risk prediction should be obtained BEFORE calling this.
 */
export async function saveJourneyEvent(
  patientId: string,
  event: JourneyEventForm,
  riskScore?: number,
  riskLevel?: RiskCategory
): Promise<SaveJourneyEventResponse> {
  if (isDemoMode) {
    await delay(400);
    const eventId = `EVT-${Date.now()}`;
    return {
      event_id: eventId,
      patient_id: patientId,
      message: "Journey event recorded successfully.",
    };
  }
  // Map frontend lowercase keys → backend uppercase keys (Databricks schema)
  const payload = {
    Patient_ID:          patientId,
    Current_Stage:       event.current_stage,
    Event_Date:          event.event_date,
    PA_Delay_Days:       event.pa_delay_days,
    Stockout_Flag:       event.pa_required ? 0 : 0,
    Contact_Attempts:    event.contact_attempts,
    Support_Enrollment:  0,
    Claim_Status:        "Pending",
    risk_score:          riskScore,
    risk_level:          riskLevel,
  };
  return apiPost<object, SaveJourneyEventResponse>(
    `/api/patients/${patientId}/events`,
    payload
  );
}

/**
 * Get the journey event history for a patient.
 * In demo mode: returns centralized mock events.
 */
export async function getPatientEvents(
  patientId: string
): Promise<JourneyEvent[]> {
  if (isDemoMode) {
    await delay(200);
    return mockPatientEvents(patientId);
  }
  return apiGet<JourneyEvent[]>(`/api/patients/${patientId}/events`);
}

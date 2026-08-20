// ============================================================
// Patient types
// ============================================================

export type JourneyStage =
  | "Diagnosis"
  | "Prescription"
  | "Prior Authorization"
  | "Copay"
  | "First Fill";

export type RiskCategory = "LOW" | "MEDIUM" | "HIGH";

export type PatientOutcome = "Completed" | "Dropped" | "Active";

export interface RiskFactor {
  name: string;
  contribution: number; // 0–1
  description: string;
}

export interface Patient {
  patient_id: string;
  current_stage: JourneyStage;
  outcome: PatientOutcome;
  risk_score: number; // 0–100
  risk_category: RiskCategory;
  days_in_current_stage: number;
  risk_factors: RiskFactor[];
  region: string;
  insurance_type: string;
  diagnosis_type: string;
  provider_type: string;
  is_new_patient: boolean;
  diagnosis_month: string; // YYYY-MM
}

export interface PatientJourneyTimeline {
  stage: JourneyStage;
  status: "completed" | "current" | "pending" | "dropped";
  date?: string;
  days_taken?: number;
}

// ── Patient Registration (hospital-facing form) ──────────────

export interface PatientRegistration {
  patient_id: string;
  age: number;
  region: string;
  diagnosis: string;
  therapy: string;
  insurance: string;
  copay_amount: number;
}

export interface PatientRegistrationResponse {
  patient_id: string;
  message?: string;
}

// ── Journey Event (nurse entry form) ────────────────────────

export interface JourneyEventForm {
  patient_id: string;
  current_stage: JourneyStage;
  event: string;
  age: number;
  region: string;
  diagnosis: string;
  therapy: string;
  insurance: string;
  copay_amount: number;
  pa_required: boolean;
  pa_delay_days: number;
  contact_attempts: number;
  event_date: string; // ISO date string
  notes?: string;
}

export interface JourneyEvent {
  event_id: string;
  patient_id: string;
  stage: JourneyStage;
  event?: string;
  event_date: string;
  risk_score?: number;
  risk_level?: RiskCategory;
  notes?: string;
  created_at: string;
}

export interface SaveJourneyEventResponse {
  event_id: string;
  patient_id: string;
  message?: string;
}

// ── Instant Risk Score ────────────────────────────────────────

export interface InstantRiskRequest {
  patient_id: string;
  current_stage: JourneyStage;
  age: number;
  region: string;
  diagnosis: string;
  therapy: string;
  insurance: string;
  copay_amount: number;
  pa_required: boolean;
  pa_delay_days: number;
  contact_attempts: number;
}

export interface InstantRiskResponse {
  risk_score: number;       // 0.0 – 1.0
  risk_level: RiskCategory;
  risk_factors?: Array<{
    feature: string;
    contribution: number;
    direction: "positive" | "negative";
  }>;
}

// ── Patient Detail (full view) ────────────────────────────────

export interface PatientDetail {
  patient_id: string;
  age: number;
  region: string;
  diagnosis: string;
  therapy: string;
  insurance: string;
  copay_amount: number;
  current_stage: JourneyStage;
  risk_score: number;
  risk_level: RiskCategory;
  last_updated: string;
  timeline: PatientJourneyTimeline[];
  events: JourneyEvent[];
}

// ── Patient List Item ─────────────────────────────────────────

export interface PatientListItem {
  patient_id: string;
  age: number;
  region: string;
  insurance: string;
  current_stage: JourneyStage;
  risk_score: number;
  risk_level: RiskCategory;
  last_updated: string;
}

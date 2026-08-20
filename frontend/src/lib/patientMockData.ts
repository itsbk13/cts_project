// ============================================================
// Patient Mock Data — Patient Journey Intelligence
// Centralized mock data for patient/journey/risk workflow.
//
// All mock data follows the same shape as backend API contracts.
// When FastAPI is connected, these are replaced by real API calls.
// ============================================================

import type {
  PatientDetail,
  PatientListItem,
  JourneyEvent,
  InstantRiskRequest,
  InstantRiskResponse,
  RiskCategory,
  JourneyStage,
} from "@/types/patient";

// ── Patient List ──────────────────────────────────────────────

export const mockPatientList: PatientListItem[] = [
  {
    patient_id: "PT-10001",
    age: 54,
    region: "Southeast",
    insurance: "Medicaid",
    current_stage: "Prior Authorization",
    risk_score: 91,
    risk_level: "HIGH",
    last_updated: "2024-06-19",
  },
  {
    patient_id: "PT-10002",
    age: 67,
    region: "Southwest",
    insurance: "Medicare",
    current_stage: "Prior Authorization",
    risk_score: 84,
    risk_level: "HIGH",
    last_updated: "2024-06-17",
  },
  {
    patient_id: "PT-10003",
    age: 42,
    region: "Midwest",
    insurance: "Commercial",
    current_stage: "Copay",
    risk_score: 62,
    risk_level: "MEDIUM",
    last_updated: "2024-06-15",
  },
  {
    patient_id: "PT-10004",
    age: 38,
    region: "Northeast",
    insurance: "Commercial",
    current_stage: "Prescription",
    risk_score: 28,
    risk_level: "LOW",
    last_updated: "2024-06-14",
  },
  {
    patient_id: "PT-10005",
    age: 71,
    region: "West",
    insurance: "Medicare",
    current_stage: "First Fill",
    risk_score: 45,
    risk_level: "MEDIUM",
    last_updated: "2024-06-13",
  },
  {
    patient_id: "PT-10006",
    age: 29,
    region: "Southeast",
    insurance: "Medicaid",
    current_stage: "Copay",
    risk_score: 77,
    risk_level: "HIGH",
    last_updated: "2024-06-12",
  },
  {
    patient_id: "PT-10007",
    age: 55,
    region: "Southwest",
    insurance: "Commercial",
    current_stage: "Prior Authorization",
    risk_score: 68,
    risk_level: "MEDIUM",
    last_updated: "2024-06-11",
  },
  {
    patient_id: "PT-10008",
    age: 48,
    region: "Midwest",
    insurance: "Self-Pay",
    current_stage: "Prescription",
    risk_score: 83,
    risk_level: "HIGH",
    last_updated: "2024-06-10",
  },
];

// ── Canonical Patient Detail (PT-10001) ───────────────────────

export const mockPatientDetail: PatientDetail = {
  patient_id: "PT-10001",
  age: 54,
  region: "Southeast",
  diagnosis: "Type B",
  therapy: "Biologic A",
  insurance: "Medicaid",
  copay_amount: 120,
  current_stage: "Prior Authorization",
  risk_score: 91,
  risk_level: "HIGH",
  last_updated: "2024-06-19T14:30:00Z",
  timeline: [
    { stage: "Diagnosis",           status: "completed", date: "2024-06-01", days_taken: 0  },
    { stage: "Prescription",        status: "completed", date: "2024-06-05", days_taken: 4  },
    { stage: "Prior Authorization", status: "current",   date: "2024-06-19", days_taken: 14 },
    { stage: "Copay",               status: "pending" },
    { stage: "First Fill",          status: "pending" },
  ],
  events: [
    {
      event_id: "EVT-001",
      patient_id: "PT-10001",
      stage: "Diagnosis",
      event_date: "2024-06-01",
      risk_score: 22,
      risk_level: "LOW",
      notes: "Initial diagnosis confirmed.",
      created_at: "2024-06-01T09:00:00Z",
    },
    {
      event_id: "EVT-002",
      patient_id: "PT-10001",
      stage: "Prescription",
      event_date: "2024-06-05",
      risk_score: 38,
      risk_level: "LOW",
      notes: "Prescription issued by specialist.",
      created_at: "2024-06-05T11:00:00Z",
    },
    {
      event_id: "EVT-003",
      patient_id: "PT-10001",
      stage: "Prior Authorization",
      event_date: "2024-06-19",
      risk_score: 91,
      risk_level: "HIGH",
      notes: "PA submitted — awaiting payer response. 14 days pending.",
      created_at: "2024-06-19T14:30:00Z",
    },
  ],
};

// ── Dynamic Mock Generator ────────────────────────────────────

const STAGES: JourneyStage[] = [
  "Diagnosis",
  "Prescription",
  "Prior Authorization",
  "Copay",
  "First Fill",
];

const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West"];
const INSURANCES = ["Commercial", "Medicare", "Medicaid", "Self-Pay"];
const DIAGNOSES = ["Type A", "Type B", "Type C", "Rare Disease"];
const THERAPIES = ["Biologic A", "Biologic B", "Small Molecule", "Infusion"];

export function generateMockPatientDetail(patientId: string): PatientDetail {
  const hash = patientId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const stageIdx = hash % STAGES.length;
  const currentStage = STAGES[stageIdx];
  const riskScore = 30 + (hash % 60);
  const riskLevel: RiskCategory =
    riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW";

  const timeline = STAGES.map((stage, i) => {
    if (i < stageIdx)
      return { stage, status: "completed" as const, date: `2024-0${i + 5}-${10 + i}`, days_taken: 4 + i * 2 };
    if (i === stageIdx)
      return { stage, status: "current" as const, date: `2024-0${stageIdx + 5}-15`, days_taken: 5 + (hash % 10) };
    return { stage, status: "pending" as const };
  });

  const events: JourneyEvent[] = STAGES.slice(0, stageIdx + 1).map(
    (stage, i) => ({
      event_id: `EVT-${patientId}-${i + 1}`,
      patient_id: patientId,
      stage,
      event_date: `2024-0${i + 5}-${10 + i}`,
      risk_score: 20 + i * 15,
      risk_level: (20 + i * 15 >= 70 ? "HIGH" : 20 + i * 15 >= 40 ? "MEDIUM" : "LOW") as RiskCategory,
      notes: `Stage ${stage} event recorded.`,
      created_at: `2024-0${i + 5}-${10 + i}T10:00:00Z`,
    })
  );

  return {
    patient_id: patientId,
    age: 35 + (hash % 40),
    region: REGIONS[hash % REGIONS.length],
    diagnosis: DIAGNOSES[hash % DIAGNOSES.length],
    therapy: THERAPIES[hash % THERAPIES.length],
    insurance: INSURANCES[hash % INSURANCES.length],
    copay_amount: 50 + (hash % 200),
    current_stage: currentStage,
    risk_score: riskScore,
    risk_level: riskLevel,
    last_updated: new Date().toISOString(),
    timeline,
    events,
  };
}

// ── Patient Event History ─────────────────────────────────────

export function mockPatientEvents(patientId: string): JourneyEvent[] {
  if (patientId === "PT-10001") {
    return mockPatientDetail.events;
  }
  const detail = generateMockPatientDetail(patientId);
  return detail.events;
}

// ── Mock Risk Score Generator ─────────────────────────────────
// This simulates what the ML model would return.
// The actual calculation lives in FastAPI — not in React.

export function generateMockRiskScore(
  req: InstantRiskRequest
): InstantRiskResponse {
  // Heuristic demo score — represents expected backend ML output
  let score = 0.25; // base

  if (req.current_stage === "Prior Authorization") score += 0.25;
  else if (req.current_stage === "Copay") score += 0.15;
  else if (req.current_stage === "Prescription") score += 0.08;

  if (req.pa_required) score += 0.15;
  if (req.pa_delay_days > 7) score += 0.12;
  if (req.pa_delay_days > 14) score += 0.08;

  if (req.insurance === "Medicaid") score += 0.10;
  else if (req.insurance === "Self-Pay") score += 0.14;
  else if (req.insurance === "Medicare") score += 0.05;

  if (req.contact_attempts >= 3) score += 0.06;
  if (req.copay_amount > 100) score += 0.05;
  if (req.region === "Southeast") score += 0.04;

  score = Math.min(0.97, Math.max(0.04, score));

  const risk_level: RiskCategory =
    score >= 0.70 ? "HIGH" : score >= 0.40 ? "MEDIUM" : "LOW";

  const risk_factors = [];

  if (req.current_stage === "Prior Authorization") {
    risk_factors.push({ feature: "Current Stage (Prior Authorization)", contribution: 0.25, direction: "positive" as const });
  }
  if (req.pa_required && req.pa_delay_days > 7) {
    risk_factors.push({ feature: `PA Delay Days (${req.pa_delay_days} days)`, contribution: 0.20, direction: "positive" as const });
  }
  if (req.insurance === "Medicaid" || req.insurance === "Self-Pay") {
    risk_factors.push({ feature: `Insurance Type (${req.insurance})`, contribution: 0.12, direction: "positive" as const });
  }
  if (req.contact_attempts >= 3) {
    risk_factors.push({ feature: `Contact Attempts (${req.contact_attempts})`, contribution: 0.06, direction: "positive" as const });
  }
  if (req.copay_amount > 100) {
    risk_factors.push({ feature: `Copay Amount ($${req.copay_amount})`, contribution: 0.05, direction: "positive" as const });
  }

  return { risk_score: score, risk_level, risk_factors };
}

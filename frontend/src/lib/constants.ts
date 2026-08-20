// ============================================================
// Application-wide constants & Design Tokens
// Palette: Deep Navy + Deep Teal + Emerald + Amber + Coral
// ============================================================

import type { JourneyStage } from "@/types/patient";
import type { SuggestedPrompt } from "@/types/ai";

// ── Journey Stages ────────────────────────────────────────────

export const JOURNEY_STAGES: JourneyStage[] = [
  "Diagnosis",
  "Prescription",
  "Prior Authorization",
  "Copay",
  "First Fill",
];

// ── Navigation ────────────────────────────────────────────────

export const NAV_ITEMS = [
  { label: "Command Center",   href: "/",          icon: "LayoutDashboard" },
  { label: "Journey",          href: "/funnel",    icon: "GitMerge"        },
  { label: "Cohorts",          href: "/cohorts",   icon: "Users"           },
  { label: "Leakage",          href: "/leakage",   icon: "Droplets"        },
  { label: "Survival",         href: "/survival",  icon: "TrendingDown"    },
  { label: "Risk Monitor",     href: "/risk",      icon: "AlertTriangle"   },
  { label: "Explainability",   href: "/shap",      icon: "BarChart2"       },
] as const;

// ── Filter Options ────────────────────────────────────────────

export const REGIONS = ["All", "Northeast", "Southeast", "Midwest", "Southwest", "West"];

export const INSURANCE_TYPES = [
  "All",
  "Commercial",
  "Medicare",
  "Medicaid",
  "Self-Pay",
  "Other",
];

export const DIAGNOSIS_TYPES = [
  "All",
  "Type A",
  "Type B",
  "Type C",
  "Rare Disease",
];

export const PROVIDER_TYPES = [
  "All",
  "Oncologist",
  "Rheumatologist",
  "Neurologist",
  "Primary Care",
  "Specialist",
];

export const NEW_EXISTING_OPTIONS = ["All", "New", "Existing"];

// ── Risk Palette ──────────────────────────────────────────────

export const RISK_COLORS = {
  LOW:    "#16A34A", // Emerald
  MEDIUM: "#D97706", // Warm Amber
  HIGH:   "#DC4C4C", // Coral Red
} as const;

export const RISK_BG_COLORS = {
  LOW:    "#F0FDF4",
  MEDIUM: "#FFFBEB",
  HIGH:   "#FEF2F2",
} as const;

// ── Chart colors ──────────────────────────────────────────────

export const CHART_COLORS = [
  "#0F766E", // Deep Teal
  "#172B4D", // Deep Navy
  "#16A34A", // Emerald
  "#D97706", // Amber
  "#DC4C4C", // Coral
  "#3B82F6", // Blue
  "#0D9488",
];

export const FUNNEL_COLOR = "#0F766E";
export const DROPOFF_COLOR = "#DC4C4C";

// ── AI Suggested Prompts ──────────────────────────────────────

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: "p1",
    label: "Biggest leakage point",
    question: "What is the biggest leakage point in the patient journey?",
    category: "leakage",
  },
  {
    id: "p2",
    label: "PA drop-off reasons",
    question: "Why is Prior Authorization causing the most drop-off?",
    category: "leakage",
  },
  {
    id: "p3",
    label: "Highest leakage region",
    question: "Which region has the highest patient leakage rate?",
    category: "regional",
  },
  {
    id: "p4",
    label: "High-risk patients now",
    question: "Which patients are currently at high risk of dropping off?",
    category: "risk",
  },
  {
    id: "p5",
    label: "Explain high risk patient",
    question: "Explain why this patient is high risk.",
    category: "risk",
  },
  {
    id: "p6",
    label: "Priority interventions",
    question: "What interventions should we prioritize to reduce leakage?",
    category: "intervention",
  },
];

// ── Pagination ────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;

// ── Dataset mock ──────────────────────────────────────────────

export const MOCK_DATASET = {
  filename: "patient_journey.xlsx",
  patient_count: 0,
  column_count: 52,
  status: "Ready" as const,
  last_updated: "2024-08-15",
};

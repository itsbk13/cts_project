// ============================================================
// Utility functions
// ============================================================

import type { RiskCategory } from "@/types/patient";
import { RISK_COLORS, RISK_BG_COLORS } from "./constants";

// ── Number formatting ─────────────────────────────────────────

/**
 * Format a number as USD currency.
 * e.g. 1200000 → "$1.2M"
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format a percentage value.
 * e.g. 0.342 → "34.2%" (if decimal) or 34.2 → "34.2%"
 */
export function formatPercent(value: number, decimals = 1): string {
  const pct = value > 1 ? value : value * 100;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Format a large number with commas.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Format days.
 */
export function formatDays(days: number | null): string {
  if (days === null) return "N/A";
  return `${days.toFixed(1)}d`;
}

// ── Risk helpers ──────────────────────────────────────────────

export function getRiskColor(category: RiskCategory): string {
  return RISK_COLORS[category];
}

export function getRiskBgColor(category: RiskCategory): string {
  return RISK_BG_COLORS[category];
}

export function getRiskLabel(category: RiskCategory): string {
  return category.charAt(0) + category.slice(1).toLowerCase() + " Risk";
}

/**
 * Return a risk category from a 0–100 score.
 */
export function scoreToCategory(score: number): RiskCategory {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

// ── Date helpers ──────────────────────────────────────────────

export function formatMonth(isoMonth: string): string {
  const [year, month] = isoMonth.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ── ID helpers ────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── Clamp ─────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Journey stage icon map ────────────────────────────────────

export function getStageOrder(stage: string): number {
  const order: Record<string, number> = {
    "Diagnosis": 1,
    "Prescription": 2,
    "Prior Authorization": 3,
    "Copay": 4,
    "First Fill": 5,
  };
  return order[stage] ?? 0;
}

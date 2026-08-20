"use client";

import React from "react";
import type { RiskCategory } from "@/types/patient";
import { RISK_COLORS, RISK_BG_COLORS } from "@/lib/constants";

// ============================================================
// StatusBadge — risk label and general status badges
// ============================================================

type BadgeVariant = "risk" | "impact" | "status" | "stage";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  riskCategory?: RiskCategory;
  impact?: "HIGH" | "MEDIUM" | "LOW";
  size?: "sm" | "md";
}

export function StatusBadge({
  label,
  variant = "status",
  riskCategory,
  impact,
  size = "md",
}: StatusBadgeProps) {
  const paddingY = size === "sm" ? "2px" : "3px";
  const paddingX = size === "sm" ? "7px" : "9px";
  const fontSize  = size === "sm" ? "11px" : "12px";

  let color = "var(--color-text-secondary)";
  let bg    = "var(--color-surface-hover)";
  let borderColor = "var(--color-border)";

  if (variant === "risk" && riskCategory) {
    color       = RISK_COLORS[riskCategory];
    bg          = RISK_BG_COLORS[riskCategory];
    borderColor = color + "33"; // 20% opacity border
  } else if (variant === "impact" && impact) {
    const map = {
      HIGH:   { color: RISK_COLORS.HIGH,   bg: RISK_BG_COLORS.HIGH   },
      MEDIUM: { color: RISK_COLORS.MEDIUM, bg: RISK_BG_COLORS.MEDIUM },
      LOW:    { color: RISK_COLORS.LOW,    bg: RISK_BG_COLORS.LOW    },
    };
    color = map[impact].color;
    bg    = map[impact].bg;
    borderColor = color + "33";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${paddingY} ${paddingX}`,
        borderRadius: "4px",
        border: `1px solid ${borderColor}`,
        background: bg,
        color,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}

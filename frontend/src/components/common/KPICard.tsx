"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ============================================================
// KPICard — top-level metric display
// ============================================================

type Tone = "default" | "success" | "warning" | "danger" | "info";

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: number;          // positive = improvement, negative = regression
  deltaLabel?: string;     // e.g. "vs last month"
  tone?: Tone;
  icon?: React.ReactNode;
  loading?: boolean;
}

const TONE_STYLES: Record<Tone, { color: string; bg: string }> = {
  default: { color: "var(--color-primary)",  bg: "var(--color-primary-light)" },
  success: { color: "var(--color-success)",  bg: "var(--color-success-bg)"   },
  warning: { color: "var(--color-warning)",  bg: "var(--color-warning-bg)"   },
  danger:  { color: "var(--color-danger)",   bg: "var(--color-danger-bg)"    },
  info:    { color: "var(--color-info)",     bg: "var(--color-info-bg)"      },
};

export function KPICard({
  label,
  value,
  delta,
  deltaLabel,
  tone = "default",
  icon,
  loading = false,
}: KPICardProps) {
  const toneStyle = TONE_STYLES[tone];

  if (loading) {
    return (
      <div className="card" style={{ minWidth: 0 }}>
        <div className="skeleton-pulse" style={{ height: 12, width: "60%", marginBottom: 12 }} />
        <div className="skeleton-pulse" style={{ height: 32, width: "80%", marginBottom: 8 }} />
        <div className="skeleton-pulse" style={{ height: 12, width: "40%" }} />
      </div>
    );
  }

  const isPositiveDelta = delta !== undefined && delta > 0;
  const isNegativeDelta = delta !== undefined && delta < 0;

  return (
    <div
      className="card"
      style={{
        minWidth: 0,
        borderLeft: `3px solid ${toneStyle.color}`,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span className="text-kpi-label" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
        {icon && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: toneStyle.bg,
              color: toneStyle.color,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="text-kpi-value">{value}</div>

      {/* Delta */}
      {delta !== undefined && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: 12,
            fontWeight: 500,
            color: isPositiveDelta
              ? "var(--color-success)"
              : isNegativeDelta
              ? "var(--color-danger)"
              : "var(--color-text-muted)",
          }}
        >
          {isPositiveDelta ? (
            <TrendingUp size={13} />
          ) : isNegativeDelta ? (
            <TrendingDown size={13} />
          ) : (
            <Minus size={13} />
          )}
          <span>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}%{deltaLabel ? ` ${deltaLabel}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

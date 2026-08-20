"use client";

import React from "react";
import type { LeakageDriver } from "@/types/analytics";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatNumber, formatPercent } from "@/lib/utils";

// ============================================================
// TopLeakageDrivers — compact table of top 3 leakage drivers
// ============================================================

interface TopLeakageDriversProps {
  data: LeakageDriver[];
  limit?: number;
}

export function TopLeakageDrivers({ data, limit = 3 }: TopLeakageDriversProps) {
  const drivers = data.slice(0, limit);
  const maxPatients = drivers[0]?.affected_patients ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {drivers.map((driver, idx) => (
        <div key={driver.driver}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {/* Rank badge */}
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: idx === 0 ? "var(--color-danger)" : idx === 1 ? "var(--color-warning)" : "var(--color-info)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                aria-label={`Rank ${idx + 1}`}
              >
                {idx + 1}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {driver.driver}
              </span>
            </div>
            <StatusBadge
              label={driver.impact}
              variant="impact"
              impact={driver.impact}
              size="sm"
            />
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 6,
              background: "var(--color-border)",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(driver.affected_patients / maxPatients) * 100}%`,
                background: idx === 0 ? "var(--color-danger)" : idx === 1 ? "var(--color-warning)" : "var(--color-info)",
                borderRadius: 3,
                transition: "width 0.6s ease",
              }}
            />
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 16 }}>
            <span className="text-meta">
              {formatNumber(driver.affected_patients)} patients
            </span>
            <span className="text-meta">
              {formatPercent(driver.confidence * 100, 0)} confidence
            </span>
            <span className="text-meta" style={{ color: "var(--color-text-muted)" }}>
              {driver.stage}
            </span>
          </div>

          {idx < drivers.length - 1 && (
            <div style={{ height: 1, background: "var(--color-border)", marginTop: 12 }} />
          )}
        </div>
      ))}
    </div>
  );
}

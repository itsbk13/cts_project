"use client";

import React from "react";
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { RiskDistributionPoint } from "@/types/risk";
import { RISK_COLORS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

// ============================================================
// RiskSummaryChart — risk distribution visual (radial bars)
// ============================================================

interface RiskSummaryChartProps {
  data: RiskDistributionPoint[];
}

export function RiskSummaryChart({ data }: RiskSummaryChartProps) {
  const chartData = data.map((d) => ({
    name: `${d.category.charAt(0) + d.category.slice(1).toLowerCase()} Risk`,
    value: d.percentage,
    count: d.count,
    fill: RISK_COLORS[d.category],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d) => {
        const color = RISK_COLORS[d.category];
        const label = `${d.category.charAt(0)}${d.category.slice(1).toLowerCase()} Risk`;
        return (
          <div key={d.category}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: color,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {label}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color }}>
                  {d.percentage.toFixed(1)}%
                </span>
                <span className="text-meta">{formatNumber(d.count)} patients</span>
              </div>
            </div>
            <div
              style={{
                height: 8,
                background: "var(--color-border)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${d.percentage}%`,
                  background: color,
                  borderRadius: 4,
                  transition: "width 0.6s ease",
                }}
                role="progressbar"
                aria-valuenow={d.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${d.percentage.toFixed(1)}%`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

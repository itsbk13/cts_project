"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { LeakageDriver } from "@/types/analytics";
import { formatNumber, formatPercent } from "@/lib/utils";

// ============================================================
// LeakageDriverChart — Horizontal Bar Chart for Hazard Ratios
// Coral = High Impact | Amber = Medium Impact | Teal = Lower Impact
// ============================================================

interface LeakageDriverChartProps {
  data: LeakageDriver[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: LeakageDriver }[];
}) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "12px 14px",
          fontSize: 13,
          boxShadow: "var(--shadow-dropdown)",
          maxWidth: 280,
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 6, color: "var(--color-navy)" }}>
          {d.driver}
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
          Hazard Ratio: <strong style={{ color: "var(--color-danger)" }}>{(d.hazard_ratio ?? 1).toFixed(2)}x</strong>
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
          Affected Patients: <strong>{formatNumber(d.affected_patients)}</strong>
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
          Confidence: <strong>{formatPercent(d.confidence * 100, 0)}</strong>
        </p>
        {d.confidence_interval && (
          <p style={{ margin: "2px 0", fontSize: 11, color: "var(--color-text-muted)" }}>
            95% CI: [{d.confidence_interval[0].toFixed(2)}, {d.confidence_interval[1].toFixed(2)}]
          </p>
        )}
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
          Stage: {d.stage}
        </p>
      </div>
    );
  }
  return null;
};

export function LeakageDriverChart({ data }: LeakageDriverChartProps) {
  const sorted = [...data].sort((a, b) => (b.hazard_ratio ?? 1) - (a.hazard_ratio ?? 1));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 4, right: 64, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[0, 3]}
          tickFormatter={(v: number) => `${v.toFixed(1)}x`}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="driver"
          width={180}
          tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-hover)" }} />
        <Bar dataKey="hazard_ratio" maxBarSize={18} radius={[0, 4, 4, 0]}>
          {sorted.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.impact === "HIGH"
                  ? "var(--color-danger)" // Coral
                  : entry.impact === "MEDIUM"
                  ? "var(--color-warning)" // Amber
                  : "var(--color-teal)"   // Teal
              }
            />
          ))}
          <LabelList
            dataKey="hazard_ratio"
            position="right"
            formatter={(v: unknown) => `${((v as number) ?? 1).toFixed(2)}x`}
            style={{ fontSize: 11, fill: "var(--color-text-primary)", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

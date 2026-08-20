"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CohortComparison } from "@/types/analytics";
import { formatNumber } from "@/lib/utils";

// ============================================================
// CohortComparisonChart — grouped bar chart comparing cohorts
// Shows first_fill_rate and dropoff_rate side by side per cohort.
// ============================================================

interface CohortComparisonChartProps {
  data: CohortComparison[];
  /** If true, shows only New/Existing (2 items). Otherwise full list. */
  mode?: "all" | "newExisting" | "insurance";
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          boxShadow: "var(--shadow-dropdown)",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: "2px 0", color: p.color, fontWeight: 500 }}>
            {p.name}: {p.value.toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CohortComparisonChart({ data, mode = "all" }: CohortComparisonChartProps) {
  const filtered =
    mode === "newExisting"
      ? data.filter((d) => d.label === "New Patients" || d.label === "Existing Patients")
      : mode === "insurance"
      ? data.filter((d) =>
          ["Commercial", "Medicare", "Medicaid", "Self-Pay"].includes(d.label)
        )
      : data;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={filtered}
        margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
        barCategoryGap="30%"
        barGap={4}
      >
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 80]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-hover)" }} />
        <Legend
          formatter={(value: string) => (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{value}</span>
          )}
        />
        <Bar dataKey="first_fill_rate" name="First Fill Rate" fill="var(--color-success)" radius={[3, 3, 0, 0]} maxBarSize={40} />
        <Bar dataKey="dropoff_rate"    name="Drop-off Rate"   fill="var(--color-danger)"  radius={[3, 3, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

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
  LabelList,
  Cell,
} from "recharts";
import type { RegionalLeakage } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils";

// ============================================================
// RegionalComparisonChart — bars for regional drop-off + patient count
// ============================================================

interface RegionalComparisonChartProps {
  data: RegionalLeakage[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: RegionalLeakage }[];
}) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
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
        <p style={{ fontWeight: 600, marginBottom: 6 }}>{d.region}</p>
        <p style={{ margin: "2px 0", color: "var(--color-danger)", fontWeight: 600 }}>
          Drop-off: {d.dropoff_rate.toFixed(1)}%
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
          Patients: {d.patient_count.toLocaleString()}
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-warning)" }}>
        </p>
      </div>
    );
  }
  return null;
};

export function RegionalComparisonChart({ data }: RegionalComparisonChartProps) {
  const sorted = [...data].sort((a, b) => b.dropoff_rate - a.dropoff_rate);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={sorted} margin={{ top: 4, right: 60, bottom: 4, left: 0 }} layout="vertical">
        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[0, 55]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="region"
          width={80}
          tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-hover)" }} />
        <Bar dataKey="dropoff_rate" maxBarSize={22} radius={[0, 4, 4, 0]}>
          {sorted.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.dropoff_rate > 42
                  ? "var(--color-danger)"
                  : entry.dropoff_rate > 38
                  ? "var(--color-warning)"
                  : "var(--color-primary)"
              }
            />
          ))}
          <LabelList
            dataKey="dropoff_rate"
            position="right"
            formatter={(v: unknown) => `${(v as number).toFixed(1)}%`}
            style={{ fontSize: 11, fill: "var(--color-text-secondary)", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

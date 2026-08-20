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
} from "recharts";
import type { RegionalLeakage } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils";

// ============================================================
// RegionalLeakageChart — bar chart of leakage rate by region
// ============================================================

interface RegionalLeakageChartProps {
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
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.region}</p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
          Drop-off rate: <strong style={{ color: "var(--color-danger)" }}>{d.dropoff_rate.toFixed(1)}%</strong>
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
          Patients: <strong>{d.patient_count.toLocaleString()}</strong>
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
        </p>
      </div>
    );
  }
  return null;
};

export function RegionalLeakageChart({ data }: RegionalLeakageChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={[...data].sort((a, b) => b.dropoff_rate - a.dropoff_rate)}
        layout="vertical"
        margin={{ top: 4, right: 52, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[0, 60]}
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
        <Bar dataKey="dropoff_rate" fill="var(--color-primary)" radius={[0, 4, 4, 0]} maxBarSize={22}>
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

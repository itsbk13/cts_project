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
import type { GlobalSHAPImportance } from "@/types/risk";

// ============================================================
// GlobalSHAPChart — Horizontal bar chart of global feature importance
// ============================================================

interface GlobalSHAPChartProps {
  data: GlobalSHAPImportance[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: GlobalSHAPImportance }[];
}) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
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
        <p style={{ fontWeight: 600, marginBottom: 4, color: "var(--color-text-primary)" }}>
          #{item.rank}: {item.feature}
        </p>
        <p style={{ color: "var(--color-primary)", margin: 0, fontWeight: 500 }}>
          Mean |SHAP Value|: {item.mean_abs_shap.toFixed(3)}
        </p>
      </div>
    );
  }
  return null;
};

export function GlobalSHAPChart({ data }: GlobalSHAPChartProps) {
  const sorted = [...data].sort((a, b) => a.mean_abs_shap - b.mean_abs_shap);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 4, right: 60, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[0, 0.45]}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="feature"
          width={180}
          tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-hover)" }} />
        <Bar dataKey="mean_abs_shap" fill="var(--color-primary)" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={i >= sorted.length - 3 ? "var(--color-primary)" : "var(--color-border-strong)"} />
          ))}
          <LabelList
            dataKey="mean_abs_shap"
            position="right"
            formatter={(v: unknown) => (v as number).toFixed(2)}
            style={{ fontSize: 11, fill: "var(--color-text-secondary)", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

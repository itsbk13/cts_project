"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { OutcomeDistribution } from "@/types/analytics";
import { formatNumber } from "@/lib/utils";

// ============================================================
// OutcomeChart — patient outcome distribution pie chart
// ============================================================

const COLORS = ["#16A34A", "#DC2626", "#2563EB"];

interface OutcomeChartProps {
  data: OutcomeDistribution[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: OutcomeDistribution }[] }) => {
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
          {item.outcome}
        </p>
        <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
          {formatNumber(item.count)} patients ({item.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function OutcomeChart({ data }: OutcomeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="count"
          nameKey="outcome"
          label={(props: PieLabelRenderProps) => {
            const pct = typeof props.percent === "number" ? props.percent * 100 : 0;
            return `${pct.toFixed(1)}%`;
          }}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

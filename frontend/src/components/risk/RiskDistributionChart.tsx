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
import type { RiskDistributionPoint } from "@/types/risk";
import { RISK_COLORS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

// ============================================================
// RiskDistributionChart — Donut breakdown of risk categories
// ============================================================

interface RiskDistributionChartProps {
  data: RiskDistributionPoint[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: RiskDistributionPoint }[];
}) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const color = RISK_COLORS[item.category];
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
        <p style={{ fontWeight: 600, marginBottom: 4, color }}>
          {item.category} Risk
        </p>
        <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
          {formatNumber(item.count)} patients ({item.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  const chartData = data.map((d) => ({
    name: `${d.category} Risk`,
    ...d,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="count"
          nameKey="name"
          label={(props: PieLabelRenderProps) => {
            const pct = typeof props.percent === "number" ? props.percent * 100 : 0;
            return `${pct.toFixed(1)}%`;
          }}
          labelLine={false}
        >
          {data.map((entry) => (
            <Cell key={entry.category} fill={RISK_COLORS[entry.category]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

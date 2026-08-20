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
import type { StageLeakage } from "@/types/analytics";

// ============================================================
// StageDropoffChart — horizontal bar chart of drop-off by stage
// ============================================================

interface StageDropoffChartProps {
  data: StageLeakage[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: StageLeakage; value: number }[];
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
        <p style={{ fontWeight: 600, marginBottom: 4, color: "var(--color-text-primary)" }}>
          {d.stage}
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
          Drop-off rate: <strong style={{ color: "var(--color-danger)" }}>{d.dropoff_rate.toFixed(1)}%</strong>
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)" }}>
          Patients affected: <strong>{d.dropoff_count.toLocaleString()}</strong>
        </p>
        <p style={{ margin: "2px 0", color: "var(--color-text-secondary)", fontSize: 11 }}>
          Top driver: {d.top_driver}
        </p>
      </div>
    );
  }
  return null;
};

export function StageDropoffChart({ data }: StageDropoffChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[0, 25]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          width={130}
          tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-hover)" }} />
        <Bar dataKey="dropoff_rate" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.dropoff_rate > 15
                  ? "var(--color-danger)"
                  : entry.dropoff_rate > 8
                  ? "var(--color-warning)"
                  : "var(--color-success)"
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

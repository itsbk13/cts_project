"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { SurvivalData } from "@/types/analytics";
import { formatPercent } from "@/lib/utils";

// ============================================================
// KaplanMeierChart — survival probability curve by group
// ============================================================

interface KaplanMeierChartProps {
  data: SurvivalData;
}

const GROUP_COLORS: Record<string, string> = {
  "Overall":    "#1557A6",
  "Commercial": "#16A34A",
  "Medicaid":   "#DC2626",
  "Medicare":   "#D97706",
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
}) => {
  if (active && payload && payload.length) {
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
        <p style={{ fontWeight: 600, marginBottom: 6 }}>Day {label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: "2px 0", color: p.color, fontWeight: 500 }}>
            {p.name}: {formatPercent(p.value * 100)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function KaplanMeierChart({ data }: KaplanMeierChartProps) {
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set(data.groups));

  // Pivot data: [{time, Overall: x, Commercial: y, ...}, ...]
  const times = [...new Set(data.curves.map((p) => p.time))].sort((a, b) => a - b);
  const chartData = times.map((t) => {
    const row: Record<string, number> = { time: t };
    data.groups.forEach((g) => {
      const point = data.curves.find((p) => p.time === t && p.group === g);
      if (point) row[g] = point.survival_probability;
    });
    return row;
  });

  const toggleGroup = (group: string) => {
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        if (next.size > 1) next.delete(group); // keep at least one
      } else {
        next.add(group);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Group toggles */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {data.groups.map((g) => (
          <button
            key={g}
            onClick={() => toggleGroup(g)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 20,
              border: `1px solid ${visibleGroups.has(g) ? GROUP_COLORS[g] : "var(--color-border)"}`,
              background: visibleGroups.has(g) ? GROUP_COLORS[g] + "1A" : "var(--color-surface)",
              color: visibleGroups.has(g) ? GROUP_COLORS[g] : "var(--color-text-muted)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            id={`survival-toggle-${g.toLowerCase()}`}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: visibleGroups.has(g) ? GROUP_COLORS[g] : "var(--color-border)",
              }}
            />
            {g}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 16, left: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            label={{ value: "Days since diagnosis", position: "insideBottom", offset: -10, fontSize: 12, fill: "var(--color-text-muted)" }}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={40}
            label={{ value: "Still in journey", angle: -90, position: "insideLeft", offset: 10, fontSize: 12, fill: "var(--color-text-muted)" }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Median reference line */}
          <ReferenceLine
            x={data.median_survival_days}
            stroke="var(--color-text-muted)"
            strokeDasharray="4 4"
            label={{
              value: `Median: ${data.median_survival_days}d`,
              position: "top",
              fontSize: 11,
              fill: "var(--color-text-muted)",
            }}
          />

          {data.groups.map((g) =>
            visibleGroups.has(g) ? (
              <Line
                key={g}
                type="stepAfter"
                dataKey={g}
                name={g}
                stroke={GROUP_COLORS[g]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                strokeDasharray={g === "Overall" ? undefined : "5 3"}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

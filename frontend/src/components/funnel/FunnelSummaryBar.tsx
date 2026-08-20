"use client";

import React from "react";
import type { FunnelData } from "@/types/analytics";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils";
import { TrendingDown, CheckCircle2, Clock } from "lucide-react";

// ============================================================
// FunnelSummaryBar — key metrics summary below the funnel
// ============================================================

interface FunnelSummaryBarProps {
  data: FunnelData;
}

export function FunnelSummaryBar({ data }: FunnelSummaryBarProps) {
  const totalDropped = data.total_entered - data.total_completed;
  const biggestDropStage = [...data.stages].sort((a, b) => b.dropoff_count - a.dropoff_count)[0];
  const avgTime = data.stages
    .map((s) => s.average_time_days)
    .filter((t): t is number => t !== null)
    .reduce((sum, t) => sum + t, 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 0,
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--color-surface)",
      }}
    >
      <SummaryItem
        icon={<CheckCircle2 size={16} color="var(--color-success)" />}
        label="Overall Conversion"
        value={formatPercent(data.overall_conversion)}
        color="var(--color-success)"
        bordered
      />
      <SummaryItem
        icon={<TrendingDown size={16} color="var(--color-danger)" />}
        label="Total Dropped"
        value={formatNumber(totalDropped)}
        subtext={`${formatPercent(100 - data.overall_conversion)} of entrants`}
        color="var(--color-danger)"
        bordered
      />
      <SummaryItem
        icon={<TrendingDown size={16} color="var(--color-warning)" />}
        label="Biggest Drop Stage"
        value={biggestDropStage?.stage ?? "N/A"}
        subtext={biggestDropStage ? `${biggestDropStage.dropoff_rate.toFixed(1)}% drop-off` : ""}
        color="var(--color-warning)"
        bordered
      />
      <SummaryItem
        icon={<Clock size={16} color="var(--color-info)" />}
        label="Total Avg Journey"
        value={`${avgTime.toFixed(1)}d`}
        subtext="Diagnosis to First Fill"
        color="var(--color-info)"
      />
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  subtext,
  color,
  bordered = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  bordered?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRight: bordered ? "1px solid var(--color-border)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      {subtext && <div className="text-meta" style={{ marginTop: 3 }}>{subtext}</div>}
    </div>
  );
}

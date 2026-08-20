"use client";

import React from "react";
import type { FunnelStage } from "@/types/analytics";
import { formatNumber, formatPercent, formatDays } from "@/lib/utils";
import { Clock, TrendingDown, ArrowRight, Users } from "lucide-react";

// ============================================================
// FunnelStageCard — detailed metrics card for each journey stage
// ============================================================

interface FunnelStageCardProps {
  stage: FunnelStage;
  isFirst?: boolean;
  onClick: (stage: string) => void;
}

export function FunnelStageCard({ stage, isFirst = false, onClick }: FunnelStageCardProps) {
  const severityColor =
    stage.dropoff_rate > 15
      ? "var(--color-danger)"
      : stage.dropoff_rate > 8
      ? "var(--color-warning)"
      : "var(--color-success)";

  return (
    <button
      onClick={() => !isFirst && onClick(stage.stage)}
      disabled={isFirst}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 0,
        border: "none",
        background: "none",
        cursor: isFirst ? "default" : "pointer",
      }}
      id={`stage-card-${stage.stage.replace(/\s+/g, "-").toLowerCase()}`}
      aria-label={`${stage.stage} stage details.`}
    >
      <div
        className="card"
        style={{
          padding: "16px 18px",
          transition: "border-color 0.15s, box-shadow 0.15s",
          borderLeft: !isFirst ? `3px solid ${severityColor}` : "3px solid var(--color-primary)",
        }}
        onMouseEnter={(e) => {
          if (!isFirst) {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = "var(--color-primary)";
            el.style.boxShadow = "0 2px 8px rgba(21,87,166,0.10)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isFirst) {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = "";
            el.style.boxShadow = "";
          }
        }}
      >
        {/* Stage name */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {stage.stage}
          </span>
        </div>

        {/* Main metric — patient count */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1 }}>
            {formatNumber(stage.patient_count)}
          </span>
          <span className="text-meta">patients</span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--color-border)", marginBottom: 10 }} />

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {!isFirst && (
            <>
              <Stat
                icon={<Users size={11} />}
                label="Conversion"
                value={formatPercent(stage.conversion_rate)}
                color="var(--color-success)"
              />
              <Stat
                icon={<TrendingDown size={11} />}
                label="Drop-off"
                value={formatPercent(stage.dropoff_rate)}
                color={severityColor}
              />
            </>
          )}
          {stage.average_time_days !== null && (
            <Stat
              icon={<Clock size={11} />}
              label="Avg time"
              value={formatDays(stage.average_time_days)}
            />
          )}
          {!isFirst && stage.dropoff_count > 0 && (
            <Stat
              icon={<TrendingDown size={11} />}
              label="Dropped"
              value={`−${formatNumber(stage.dropoff_count)}`}
              color="var(--color-danger)"
            />
          )}
        </div>
      </div>
    </button>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-muted)", marginBottom: 2 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: color ?? "var(--color-text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

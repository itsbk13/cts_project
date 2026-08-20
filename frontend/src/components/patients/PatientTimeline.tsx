"use client";

import React from "react";
import { CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react";
import type { PatientJourneyTimeline, JourneyStage } from "@/types/patient";

// ============================================================
// PatientTimeline — Visual journey stage progression timeline
// Used on: Patient Detail page, Journey Event Entry page
// ============================================================

interface PatientTimelineProps {
  timeline: PatientJourneyTimeline[];
  compact?: boolean;
}

const STAGE_ORDER: JourneyStage[] = [
  "Diagnosis",
  "Prescription",
  "Prior Authorization",
  "Copay",
  "First Fill",
];

const STATUS_CONFIG = {
  completed: {
    color: "var(--color-success)",
    bg: "var(--color-success-bg)",
    border: "#BBF7D0",
    Icon: CheckCircle2,
    label: "Completed",
  },
  current: {
    color: "var(--color-warning)",
    bg: "var(--color-warning-bg)",
    border: "#FED7AA",
    Icon: Clock,
    label: "In Progress",
  },
  pending: {
    color: "var(--color-text-muted)",
    bg: "var(--color-bg)",
    border: "var(--color-border)",
    Icon: Circle,
    label: "Pending",
  },
  dropped: {
    color: "var(--color-danger)",
    bg: "var(--color-danger-bg)",
    border: "#FECACA",
    Icon: AlertCircle,
    label: "Dropped",
  },
} as const;

export function PatientTimeline({ timeline, compact = false }: PatientTimelineProps) {
  // Ensure we display all 5 stages, even if some are missing from data
  const displayTimeline = STAGE_ORDER.map((stageName) => {
    const found = timeline.find((t) => t.stage === stageName);
    return found ?? { stage: stageName, status: "pending" as const };
  });

  if (compact) {
    // Horizontal compact version for cards
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
        {displayTimeline.map((item, idx) => {
          const config = STATUS_CONFIG[item.status];
          const Icon = config.Icon;
          const isLast = idx === displayTimeline.length - 1;

          return (
            <React.Fragment key={item.stage}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: config.bg,
                    border: `2px solid ${config.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={14} color={config.color} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: config.color, textAlign: "center", lineHeight: 1.2 }}>
                  {item.stage.replace("Prior Authorization", "Prior Auth")}
                </span>
              </div>
              {!isLast && (
                <div
                  style={{
                    height: 2,
                    width: 24,
                    background: idx < displayTimeline.findIndex((t) => t.status === "pending" || t.status === "current")
                      ? "var(--color-success)"
                      : "var(--color-border)",
                    flexShrink: 0,
                    marginBottom: 18,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Full vertical timeline
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {displayTimeline.map((item, idx) => {
        const config = STATUS_CONFIG[item.status];
        const Icon = config.Icon;
        const isLast = idx === displayTimeline.length - 1;

        return (
          <div key={item.stage} style={{ display: "flex", gap: 14, position: "relative" }}>
            {/* Left column: icon + connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36, flexShrink: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: config.bg,
                  border: `2px solid ${config.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                <Icon size={17} color={config.color} />
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    background: item.status === "completed" ? "var(--color-success)" : "var(--color-border)",
                    margin: "4px 0",
                  }}
                />
              )}
            </div>

            {/* Right column: content */}
            <div
              style={{
                flex: 1,
                paddingBottom: isLast ? 0 : 18,
                paddingTop: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: item.status === "current" ? 700 : 600,
                    color: item.status === "pending" ? "var(--color-text-muted)" : "var(--color-text-primary)",
                  }}
                >
                  {item.stage}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: config.bg,
                    color: config.color,
                    border: `1px solid ${config.border}`,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {config.label}
                </span>
              </div>

              {item.date && (
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {item.status === "current" ? "Started" : "Completed"}: {item.date}
                  {item.days_taken != null && item.days_taken > 0 && (
                    <span style={{ marginLeft: 8, color: "var(--color-text-muted)" }}>
                      • {item.days_taken} {item.days_taken === 1 ? "day" : "days"}
                    </span>
                  )}
                </div>
              )}

              {item.status === "current" && item.days_taken != null && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: item.days_taken > 10 ? "var(--color-danger)" : "var(--color-warning)",
                  }}
                >
                  ⏱ {item.days_taken} days in this stage
                  {item.days_taken > 10 && " — exceeds benchmark"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

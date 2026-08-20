"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import type { RiskCategory, InstantRiskResponse } from "@/types/patient";

// ============================================================
// RiskScoreCard — Displays instant risk prediction result
// Used on: Journey Event Entry page, Patient Detail page
// ============================================================

interface RiskScoreCardProps {
  response: InstantRiskResponse;
}

const RISK_CONFIG = {
  HIGH: {
    color: "var(--color-risk-high)",
    bg: "var(--color-risk-high-bg)",
    border: "#FECACA",
    label: "HIGH RISK",
    Icon: ShieldAlert,
    description: "This patient has a high probability of dropping off the journey. Immediate action is recommended.",
  },
  MEDIUM: {
    color: "var(--color-risk-medium)",
    bg: "var(--color-risk-medium-bg)",
    border: "#FED7AA",
    label: "MEDIUM RISK",
    Icon: Shield,
    description: "This patient has a moderate drop-off risk. Monitor closely and consider proactive outreach.",
  },
  LOW: {
    color: "var(--color-risk-low)",
    bg: "var(--color-risk-low-bg)",
    border: "#BBF7D0",
    label: "LOW RISK",
    Icon: ShieldCheck,
    description: "This patient is on track. Routine monitoring is sufficient.",
  },
} as const;

export function RiskScoreCard({ response }: RiskScoreCardProps) {
  const { risk_score, risk_level, risk_factors } = response;
  const config = RISK_CONFIG[risk_level];
  const Icon = config.Icon;
  const scorePercent = Math.round(risk_score * 100);

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 10,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Score + Level */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Circular score display */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "white",
            border: `3px solid ${config.color}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 4px 14px ${config.border}`,
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: config.color,
              lineHeight: 1,
            }}
          >
            {scorePercent}%
          </span>
        </div>

        {/* Risk label and description */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Icon size={18} color={config.color} />
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: config.color,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {config.label}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.5 }}>
            {config.description}
          </p>
        </div>
      </div>

      {/* Risk factors if returned */}
      {risk_factors && risk_factors.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Contributing Factors
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {risk_factors.map((f, i) => {
              const barWidth = Math.round(Math.min(f.contribution / 0.35, 1) * 100);
              const isPositive = f.direction === "positive";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 130, fontSize: 12, color: "var(--color-text-primary)", flexShrink: 0 }}>
                    {f.feature}
                  </div>
                  <div style={{ flex: 1, background: "white", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: "100%",
                        background: isPositive ? "var(--color-risk-high)" : "var(--color-risk-low)",
                        borderRadius: 4,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isPositive ? "var(--color-risk-high)" : "var(--color-risk-low)",
                      width: 40,
                      textAlign: "right",
                    }}
                  >
                    {isPositive ? "+" : "-"}{(f.contribution * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI disclaimer */}
      <div
        style={{
          fontSize: 11,
          color: "var(--color-text-muted)",
          fontStyle: "italic",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          paddingTop: 8,
        }}
      >
        AI-assisted risk prediction. This is not a medical diagnosis. Use as a clinical decision support tool only.
      </div>
    </div>
  );
}

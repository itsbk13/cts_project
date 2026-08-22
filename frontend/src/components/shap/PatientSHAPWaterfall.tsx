"use client";

import React from "react";
import type { PatientSHAPExplanation } from "@/types/risk";
import { formatPercent } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Info, ShieldAlert } from "lucide-react";

// ============================================================
// PatientSHAPWaterfall — Centered Zero-Baseline Attribution Breakdown
// Coral (+) Increases Risk | Teal (-) Reduces Risk
// ============================================================

interface PatientSHAPWaterfallProps {
  explanation: PatientSHAPExplanation;
}

export function PatientSHAPWaterfall({ explanation }: PatientSHAPWaterfallProps) {
  const { base_value, predicted_risk, features, plain_english_summary } = explanation;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Base vs Predicted Risk comparison bar ───────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          background: "var(--color-bg)",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <span className="text-meta">Base Population Risk</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {formatPercent(base_value * 100)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-danger)" }}>
            +{( (predicted_risk - base_value) * 100 ).toFixed(1)}% net SHAP shift
          </span>
        </div>

        <div>
          <span className="text-meta">Predicted Patient Risk</span>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-danger)", marginTop: 2 }}>
            {formatPercent(predicted_risk * 100)}
          </div>
        </div>
      </div>

      {/* ── Feature Attribution Breakdown (Centered Zero-Baseline) ── */}
      <div>
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 10,
          }}
        >
          Individual Feature Contributions (TreeSHAP)
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowX: "auto" }}>
          {features.map((f) => {
            const isPushHigher = f.direction === "positive";
            const color = isPushHigher ? "var(--color-danger)" : "var(--color-teal)";
            const bg = isPushHigher ? "var(--color-danger-bg)" : "var(--color-primary-light)";
            const barWidth = Math.min(Math.abs(f.contribution) * 200, 100);

            return (
              <div
                key={f.feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  gap: 12,
                  minWidth: 500,
                }}
              >
                {/* Feature Name & Value */}
                <div style={{ width: 220, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy)" }}>
                    {f.feature}
                  </div>
                  <div className="text-meta" style={{ marginTop: 2 }}>
                    Value: <strong>{f.display_value}</strong>
                  </div>
                </div>

                {/* Visual Centered Contribution Bar */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: "var(--color-border)",
                      borderRadius: 4,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${barWidth}%`,
                        background: color,
                        borderRadius: 4,
                        marginLeft: isPushHigher ? "0" : "auto",
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color,
                      minWidth: 55,
                      textAlign: "right",
                    }}
                  >
                    {f.contribution > 0 ? `+${f.contribution.toFixed(2)}` : f.contribution.toFixed(2)}
                  </span>
                </div>

                {/* Direction Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: bg,
                    color,
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {isPushHigher ? (
                    <>
                      <ArrowUpRight size={12} />
                      <span>Increases Risk</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight size={12} />
                      <span>Reduces Risk</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Plain English Explanation (Model Explanation) ───── */}
      <div
        style={{
          padding: "14px 16px",
          background: "var(--color-surface)",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
          borderLeft: "4px solid var(--color-teal)",
          display: "flex",
          gap: 12,
        }}
      >
        <Info size={18} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--color-navy)", margin: "0 0 4px" }}>
            Model Explanation &amp; Synthesis
          </h4>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-primary)", margin: 0 }}>
            {plain_english_summary}
          </p>
        </div>
      </div>
    </div>
  );
}

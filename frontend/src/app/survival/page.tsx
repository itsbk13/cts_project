"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getSurvival } from "@/lib/api";
import type { SurvivalData } from "@/types/analytics";

import { FilterBar } from "@/components/common/FilterBar";
import { Card } from "@/components/common/Card";
import { ErrorState } from "@/components/common/ErrorState";
import { ChartSkeleton } from "@/components/common/LoadingSkeleton";
import { KaplanMeierChart } from "@/components/survival/KaplanMeierChart";
import { formatPercent } from "@/lib/utils";
import { Clock, ShieldAlert, CheckCircle2, TrendingDown, ArrowRight } from "lucide-react";
import { useDatasetStore } from "@/store/datasetStore";
import { useFilterStore } from "@/store/filterStore";

// ============================================================
// Page 5 — Survival Analytics (Time-to-Event Analytics)
// Purpose: "Understand when patients are most likely to drop off."
// ============================================================

export default function SurvivalPage() {
  const [data, setData] = useState<SurvivalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { metadata } = useDatasetStore();
  const lastUpdated = metadata.last_updated;
  const { region, diagnosis, insurance, provider, newExisting } = useFilterStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getSurvival();
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, region, diagnosis, insurance, provider, newExisting]);

  if (error) return <ErrorState onRetry={load} />;

  const cohortSurvivalStats = [
    { cohort: "Commercial", medianDays: "46 Days", day30: "78.4%", day60: "61.2%", dropoff: "32.8%", riskTier: "Low Risk" },
    { cohort: "Medicare",   medianDays: "36 Days", day30: "66.2%", day60: "45.8%", dropoff: "41.6%", riskTier: "Moderate Risk" },
    { cohort: "Medicaid",   medianDays: "26 Days", day30: "52.8%", day60: "32.4%", dropoff: "50.4%", riskTier: "High Risk" },
    { cohort: "Self-Pay",   medianDays: "18 Days", day30: "41.6%", day60: "22.1%", dropoff: "55.7%", riskTier: "Critical Risk" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Page Header Controls ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="text-page-title">Survival Analytics</h1>
          <p className="text-body" style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>
            Understand when patients are most likely to drop off.
          </p>
        </div>
        <FilterBar show={["insurance", "region"]} />
      </div>

      {/* ── Key Timepoint Survival Metric Bar ──────────────────── */}
      {loading || !data ? (
        <div className="skeleton-pulse" style={{ height: 88, borderRadius: 8 }} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 0,
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            overflow: "hidden",
            background: "var(--color-surface)",
          }}
        >
          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Clock size={15} color="var(--color-teal)" />
              <span className="text-kpi-label">Median Time to Drop-off</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-teal)" }}>
              {data.median_survival_days} Days
            </div>
            <p className="text-meta" style={{ marginTop: 2 }}>
              50% drop-off milestone
            </p>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <CheckCircle2 size={15} color="var(--color-success)" />
              <span className="text-kpi-label">30-Day Survival</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-success)" }}>
              68.0%
            </div>
            <p className="text-meta" style={{ marginTop: 2 }}>
              Active in journey at 1 month
            </p>
          </div>

          <div style={{ padding: "14px 18px", borderRight: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <TrendingDown size={15} color="var(--color-warning)" />
              <span className="text-kpi-label">60-Day Survival</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-warning)" }}>
              48.0%
            </div>
            <p className="text-meta" style={{ marginTop: 2 }}>
              Active in journey at 2 months
            </p>
          </div>

          <div style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <ShieldAlert size={15} color="var(--color-danger)" />
              <span className="text-kpi-label">90-Day Survival</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-danger)" }}>
              34.0%
            </div>
            <p className="text-meta" style={{ marginTop: 2 }}>
              Plateau conversion mark
            </p>
          </div>
        </div>
      )}

      {/* ── Visual Milestone Timeline ─────────────────────────── */}
      <div
        style={{
          padding: "14px 18px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              background: "var(--color-navy)",
              color: "white",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            DAY 0
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
            Journey Start (100%)
          </span>
        </div>

        <ArrowRight size={14} color="var(--color-text-muted)" />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              background: "var(--color-teal)",
              color: "white",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            DAY 30
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-teal)" }}>
            68% Remaining
          </span>
        </div>

        <ArrowRight size={14} color="var(--color-text-muted)" />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              background: "var(--color-warning)",
              color: "white",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            DAY 60
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-warning)" }}>
            48% Remaining
          </span>
        </div>

        <ArrowRight size={14} color="var(--color-text-muted)" />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              background: "var(--color-danger)",
              color: "white",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            DAY 90
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-danger)" }}>
            34% Remaining
          </span>
        </div>
      </div>

      {/* ── Main Hero: Kaplan-Meier Chart ──────────────────────── */}
      {loading || !data ? (
        <ChartSkeleton height={380} />
      ) : (
        <Card
          title="Kaplan-Meier Survival Curve — Probability of Remaining in Journey"
          subtitle="Non-parametric time-to-drop-off curves across payer segments. Dashed line marks the median 38-day milestone."
        >
          <KaplanMeierChart data={data} />
        </Card>
      )}

      {/* ── Cohort Survival Comparison Table ───────────────────── */}
      <Card
        title="Cohort Survival &amp; Time-to-Event Comparison"
        subtitle="Comparing median time to drop-off and milestone retention probabilities across payer cohorts"
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                {["Cohort", "Median Time to Drop-off", "30-Day Survival", "60-Day Survival", "Overall Drop-off Rate", "Risk Level"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortSurvivalStats.map((c) => (
                <tr
                  key={c.cohort}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "var(--color-bg)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "")}
                >
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {c.cohort}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-text-secondary)" }}>
                    {c.medianDays}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--color-success)" }}>
                    {c.day30}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-text-secondary)" }}>
                    {c.day60}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: parseFloat(c.dropoff) > 45 ? "var(--color-danger)" : "var(--color-text-primary)" }}>
                    {c.dropoff}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          c.riskTier.includes("High") || c.riskTier.includes("Critical")
                            ? "var(--color-danger)"
                            : c.riskTier.includes("Moderate")
                            ? "var(--color-warning)"
                            : "var(--color-success)",
                        background:
                          c.riskTier.includes("High") || c.riskTier.includes("Critical")
                            ? "var(--color-danger-bg)"
                            : c.riskTier.includes("Moderate")
                            ? "var(--color-warning-bg)"
                            : "var(--color-success-bg)",
                      }}
                    >
                      {c.riskTier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

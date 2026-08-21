"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getSurvival } from "@/lib/api";
import type { SurvivalData } from "@/types/analytics";


import { Card } from "@/components/common/Card";
import { ErrorState } from "@/components/common/ErrorState";
import { ChartSkeleton } from "@/components/common/LoadingSkeleton";
import { KaplanMeierChart } from "@/components/survival/KaplanMeierChart";
import { formatPercent } from "@/lib/utils";
import { Clock, ShieldAlert, CheckCircle2, TrendingDown, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
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
              {((data.key_timepoints.find(t => t.days === 30)?.probability || 0) * 100).toFixed(1)}%
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
              {((data.key_timepoints.find(t => t.days === 60)?.probability || 0) * 100).toFixed(1)}%
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
              {((data.key_timepoints.find(t => t.days === 90)?.probability || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-meta" style={{ marginTop: 2 }}>
              Plateau conversion mark
            </p>
          </div>
        </div>
      )}

      {data && (
        <>
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
            {((data?.key_timepoints?.find(t => t.days === 30)?.probability || 0) * 100).toFixed(0)}% Remaining
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
            {((data?.key_timepoints?.find(t => t.days === 60)?.probability || 0) * 100).toFixed(0)}% Remaining
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
            {((data?.key_timepoints?.find(t => t.days === 90)?.probability || 0) * 100).toFixed(0)}% Remaining
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
                {["Cohort", "Median Time to Drop-off", "30-Day Survival", "60-Day Survival", "Overall Drop-off Rate"].map((h) => (
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
                  {data.groups && data.groups.map((group, idx) => {
                    if (group === 'Overall') return null;
                    const groupCurve = data.curves.filter(c => c.group === group);
                    if (groupCurve.length === 0) return null;
                    
                    const median = groupCurve.find(c => c.survival_probability <= 0.5)?.time || ">90";
                    const s30 = groupCurve.find(c => c.time === 30)?.survival_probability || 0;
                    const s60 = groupCurve.find(c => c.time === 60)?.survival_probability || 0;
                    const finalS = groupCurve[groupCurve.length - 1]?.survival_probability || 0;
                    
                    return (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {group}
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--color-text-secondary)" }}>
                        {median} Days
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                        {(s30 * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-warning)" }}>
                          {(s60 * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--color-text-secondary)", fontSize: 12 }}>
                        {((1 - finalS) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )})}
                </tbody>
          </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

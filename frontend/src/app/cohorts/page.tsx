"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getCohorts, getLeakage } from "@/lib/api";
import type { CohortHeatmapCell, CohortComparison, RegionalLeakage } from "@/types/analytics";


import { Card } from "@/components/common/Card";
import { ErrorState } from "@/components/common/ErrorState";
import { ChartSkeleton } from "@/components/common/LoadingSkeleton";

import { CohortHeatmap } from "@/components/cohort/CohortHeatmap";
import { formatNumber } from "@/lib/utils";
import { useDatasetStore } from "@/store/datasetStore";
import { useFilterStore } from "@/store/filterStore";
import { MapPin } from "lucide-react";

// ============================================================
// Page 3 — Cohort Intelligence (Segmentation Workspace)
// Purpose: "Compare journey outcomes across patient segments and regions."
// ============================================================

interface CohortData {
  heatmap: CohortHeatmapCell[];
  comparisons: CohortComparison[];
  regionalLeakage: RegionalLeakage[];
}

export default function CohortsPage() {
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { region, diagnosis, insurance, provider, newExisting } = useFilterStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [cohorts, leakage] = await Promise.all([getCohorts(), getLeakage()]);
      setData({
        heatmap: cohorts.heatmap,
        comparisons: cohorts.comparisons,
        regionalLeakage: leakage.regionalLeakage,
      });
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

  // Map real databricks data to the regional table
  const regionalRows = (data?.regionalLeakage || []).map((r) => {
    const isCritical = r.dropoff_rate > 40;
    const isAttention = r.dropoff_rate > 35 && !isCritical;
    const status = isCritical ? "Critical" : isAttention ? "Needs Attention" : "Healthy";
    return {
      region: r.region,
      patients: r.patient_count,
      firstFillRate: 100 - r.dropoff_rate,
      dropoffRate: r.dropoff_rate,
      status: status
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ─── Page Header Controls ─── */}
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
          <h1 className="text-page-title">Cohort Intelligence</h1>
          <p className="text-body" style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>
            Compare journey outcomes across patient segments and regions.
          </p>
        </div>
        
      </div>

      {/* ─── MAIN HERO: Acquisition Cohort Analysis Heatmap ─── */}
      {loading || !data ? (
        <ChartSkeleton height={280} />
      ) : (
        <Card
          title="Acquisition Cohort Analysis"
          subtitle="Tracking cohort retention and drop-off across patient journey months"
        >
          <CohortHeatmap data={data.heatmap} />
        </Card>
      )}

      {/* ─── Regional Performance Table ─── */}
      {loading || !data ? (
        <ChartSkeleton height={200} />
      ) : (
        <Card
          title="Regional Performance Ledger"
          subtitle="Geographic conversion rates and drop-off volumes from Databricks"
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  {["Region", "Patients", "First Fill Rate", "Drop-off Rate"].map((h) => (
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
                {regionalRows.map((r) => {
                  const isCritical = r.status === "Critical";
                  const isAttention = r.status === "Needs Attention";
                  const badgeColor = isCritical ? "var(--color-danger)" : isAttention ? "var(--color-warning)" : "var(--color-success)";
                  const badgeBg = isCritical ? "var(--color-danger-bg)" : isAttention ? "var(--color-warning-bg)" : "var(--color-success-bg)";

                  return (
                    <tr
                      key={r.region}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "var(--color-bg)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "")}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={14} color="var(--color-teal)" />
                        {r.region}
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--color-text-secondary)" }}>
                        {formatNumber(r.patients)}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--color-success)" }}>
                        {r.firstFillRate.toFixed(1)}%
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: isCritical ? "var(--color-danger)" : isAttention ? "var(--color-warning)" : "var(--color-text-primary)" }}>
                        {r.dropoffRate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {regionalRows.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                      No regional data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

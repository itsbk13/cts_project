"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getFunnel } from "@/lib/api";
import type { FunnelData } from "@/types/analytics";
import { formatNumber, formatPercent, formatDays } from "@/lib/utils";

import { FilterBar } from "@/components/common/FilterBar";
import { Card } from "@/components/common/Card";
import { ErrorState } from "@/components/common/ErrorState";
import { ChartSkeleton } from "@/components/common/LoadingSkeleton";

import { PatientFunnel } from "@/components/overview/PatientFunnel";
import { FunnelStageCard } from "@/components/funnel/FunnelStageCard";
import { useDatasetStore } from "@/store/datasetStore";
import { useFilterStore } from "@/store/filterStore";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  TrendingDown,
  Users,
  CheckCircle2,
} from "lucide-react";

// ============================================================
// Page 2 — Journey Analytics
// Purpose: "Trace patient progression and identify where journey friction occurs."
// ============================================================

export default function JourneyPage() {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { metadata } = useDatasetStore();
  const lastUpdated = metadata.last_updated;
  const { region, diagnosis, insurance, provider, newExisting } = useFilterStore();


  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getFunnel();
      setFunnel(data);
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

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 className="page-title">Journey Analytics</h1>
            <p className="page-subtitle">Trace patient progression and identify where journey friction occurs.</p>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Data as of {lastUpdated}
          </div>
        </div>

        <FilterBar />

        {/* Top Summary / Pathway */}
        <Card title="Patient Journey Funnel">
          {loading || !funnel ? (
            <ChartSkeleton height={400} />
          ) : (
            <PatientFunnel data={funnel} interactive={false} />
          )}
        </Card>

        {/* Stage Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {loading || !funnel ? (
            [...Array(5)].map((_, i) => <ChartSkeleton key={i} height={120} />)
          ) : (
            funnel.stages.map((stage, idx) => (
              <FunnelStageCard
                key={stage.stage}
                stage={stage}
                isFirst={idx === 0}
                onClick={() => {}}
              />
            ))
          )}
        </div>

        {/* Transition Ledger Table */}
        <Card title="Comprehensive Journey Transition Ledger">
          {loading || !funnel ? (
            <ChartSkeleton height={300} />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)", textAlign: "left", color: "var(--color-text-secondary)" }}>
                    <th style={{ padding: "12px", fontWeight: 500 }}>Stage</th>
                    <th style={{ padding: "12px", fontWeight: 500 }}>Patients Entering</th>
                    <th style={{ padding: "12px", fontWeight: 500 }}>Conversion Rate</th>
                    <th style={{ padding: "12px", fontWeight: 500 }}>Drop-off Rate</th>
                    <th style={{ padding: "12px", fontWeight: 500 }}>Drop-off Count</th>
                    <th style={{ padding: "12px", fontWeight: 500 }}>Avg Days in Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.stages.map((stage, i) => (
                    <tr key={stage.stage} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{stage.stage}</td>
                      <td style={{ padding: "12px" }}>{formatNumber(stage.patient_count)}</td>
                      <td style={{ padding: "12px", color: i === 0 ? "var(--color-text-muted)" : "var(--color-success)" }}>
                        {i === 0 ? "—" : formatPercent(stage.conversion_rate)}
                      </td>
                      <td style={{ padding: "12px", color: i === 0 ? "var(--color-text-muted)" : "var(--color-danger)" }}>
                        {i === 0 ? "—" : formatPercent(stage.dropoff_rate)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {i === 0 ? "—" : formatNumber(stage.dropoff_count)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {stage.average_time_days ? formatDays(stage.average_time_days) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

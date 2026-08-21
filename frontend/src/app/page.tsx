"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  Activity,
  ArrowRight,
  Flame,
  Search,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";

import { getOverview, getLeakage, getRiskOverview, getFunnel } from "@/lib/api";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils";

import { Card } from "@/components/common/Card";

import { ErrorState } from "@/components/common/ErrorState";
import { KPIGridSkeleton, ChartSkeleton } from "@/components/common/LoadingSkeleton";

import { JourneyPathway } from "@/components/overview/JourneyPathway";
import { TopLeakageDrivers } from "@/components/overview/TopLeakageDrivers";
import { RiskSummaryChart } from "@/components/overview/RiskSummaryChart";

import type { OverviewKPIs, FunnelData, StageLeakage, RegionalLeakage, TrendPoint, OutcomeDistribution } from "@/types/analytics";
import type { RiskDistributionPoint } from "@/types/risk";
import type { LeakageDriver } from "@/types/analytics";
import { useDatasetStore } from "@/store/datasetStore";
import { useFilterStore } from "@/store/filterStore";
import Link from "next/link";

// ============================================================
// Page 1 — Patient Journey Command Center
// Purpose: "Real-time visibility into patient progression, leakage and journey risk."
// ============================================================

interface OverviewData {
  kpis: OverviewKPIs;
  outcomeDistribution: OutcomeDistribution[];
  trend: TrendPoint[];
  funnel: FunnelData;
  stageLeakage: StageLeakage[];
  regionalLeakage: RegionalLeakage[];
  leakageDrivers: LeakageDriver[];
  riskDistribution: RiskDistributionPoint[];
}

export default function CommandCenterPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);


  const { metadata } = useDatasetStore();
  const lastUpdated = metadata.last_updated;
  const { region, diagnosis, insurance, provider, newExisting, hasActiveFilters } = useFilterStore();
  const isFiltered = hasActiveFilters();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [overview, leakage, risk, funnel] = await Promise.all([
        getOverview(),
        getLeakage(),
        getRiskOverview(),
        getFunnel(),
      ]);
      setData({
        kpis: { ...overview.kpis, high_risk_active: risk.kpis.high_risk },
        outcomeDistribution: overview.outcomeDistribution,
        trend: overview.trend,
        funnel,
        stageLeakage: leakage.stageLeakage,
        regionalLeakage: leakage.regionalLeakage,
        leakageDrivers: leakage.drivers,
        riskDistribution: risk.distribution,
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

  if (error) {
    return <ErrorState onRetry={load} />;
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 className="text-page-title">Command Center</h1>
            <p className="text-body" style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>Real-time visibility into patient progression, leakage and journey risk.</p>
          </div>
          
        </div>

        {/* Global Filters */}
        

        {/* KPIs Grid */}
        {loading || !data ? (
          <KPIGridSkeleton count={5} />
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {/* Top row: 3 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <Card className="!p-4">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ padding: 8, background: "rgba(21, 87, 166, 0.1)", borderRadius: 8, color: "var(--color-primary)" }}>
                    <Users size={20} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>Total Patients</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{formatNumber(data.kpis.total_patients)}</div>
              </Card>
              
              <Card className="!p-4">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ padding: 8, background: "rgba(16, 185, 129, 0.1)", borderRadius: 8, color: "var(--color-success)" }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>On Therapy</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{formatPercent(data.kpis.first_fill_rate)}</div>
              </Card>

              <Card className="!p-4">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ padding: 8, background: "rgba(239, 68, 68, 0.1)", borderRadius: 8, color: "var(--color-danger)" }}>
                    <TrendingDown size={20} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>Journey Drop-off</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{formatPercent(data.kpis.dropoff_rate)}</div>
              </Card>
            </div>
            
            {/* Bottom row: 2 cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              <Card className="!p-4">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ padding: 8, background: "rgba(245, 158, 11, 0.1)", borderRadius: 8, color: "var(--color-warning)" }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>High Risk (Next 7d)</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{formatNumber(data.kpis.high_risk_active)}</div>
              </Card>

              <Card className="!p-4">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ padding: 8, background: "rgba(139, 92, 246, 0.1)", borderRadius: 8, color: "var(--color-info)" }}>
                    <Calendar size={20} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)" }}>Data Coverage</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>2025 onwards</div>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>
          
          {/* Left Column - Journey & Leakage */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card
              title="Patient Journey Pathway"
              subtitle="End-to-end patient progression and critical drop-off points."
              headerRight={<Link href="/funnel" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}>View Details →</Link>}
            >
              {loading || !data ? (
                <ChartSkeleton height={200} />
              ) : (
                <JourneyPathway data={data.funnel} />
              )}
            </Card>

            <Card
              title="Top Leakage Drivers"
              subtitle="Root causes associated with highest patient drop-off."
              headerRight={<Link href="/leakage" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}>View Drivers →</Link>}
            >
              {loading || !data ? (
                <ChartSkeleton height={200} />
              ) : (
                <TopLeakageDrivers data={data.leakageDrivers} />
              )}
            </Card>
          </div>

          {/* Right Column - Risk & Intervention */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card
              title="Journey Risk Distribution"
              subtitle="Patient volume by machine-learning risk tier."
              headerRight={<Link href="/risk" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}>View At-Risk Queue →</Link>}
            >
              {loading || !data ? (
                <ChartSkeleton height={300} />
              ) : (
                <RiskSummaryChart data={data.riskDistribution} />
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

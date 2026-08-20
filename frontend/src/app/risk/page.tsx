"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getRiskOverview, getRiskPatients, getPatientRisk } from "@/lib/api";
import type { RiskOverviewKPIs, RiskDistributionPoint, RiskPatient, PatientRiskDetail } from "@/types/risk";

import { FilterBar } from "@/components/common/FilterBar";
import { Card } from "@/components/common/Card";
import { KPICard } from "@/components/common/KPICard";
import { ErrorState } from "@/components/common/ErrorState";
import { KPIGridSkeleton, ChartSkeleton } from "@/components/common/LoadingSkeleton";
import { RiskDistributionChart } from "@/components/risk/RiskDistributionChart";
import { RiskTable } from "@/components/risk/RiskTable";
import { PatientRiskDrawer } from "@/components/risk/PatientRiskDrawer";
import { formatNumber } from "@/lib/utils";
import { AlertTriangle, Users, ShieldAlert, ShieldCheck, Search, Loader2 } from "lucide-react";
import { useDatasetStore } from "@/store/datasetStore";
import { useFilterStore } from "@/store/filterStore";

// ============================================================
// Page 6 — Journey Risk Monitor (Operational Intervention Queue)
// Purpose: "Identify active patients who may drop next."
// ============================================================

export default function RiskMonitorPage() {
  const [kpis, setKpis] = useState<RiskOverviewKPIs | null>(null);
  const [distribution, setDistribution] = useState<RiskDistributionPoint[]>([]);
  const [patients, setPatients] = useState<RiskPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const lastUpdated = useDatasetStore((s) => s.metadata.last_updated);
  const { region, diagnosis, insurance, provider, newExisting } = useFilterStore();

  // Selected patient state for drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRiskDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Analyze patient panel states
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<PatientRiskDetail | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [overviewRes, patientList] = await Promise.all([
        getRiskOverview(),
        getRiskPatients(),
      ]);
      setKpis(overviewRes.kpis);
      setDistribution(overviewRes.distribution);
      setPatients(patientList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await getPatientRisk(lookupId.trim());
      if (res) {
        setLookupResult(res);
      } else {
        setLookupError("Patient record not found.");
      }
    } catch {
      setLookupError("Patient ID not found in current dataset.");
    } finally {
      setLookupLoading(false);
    }
  }, [lookupId]);

  useEffect(() => {
    load();
  }, [load, region, diagnosis, insurance, provider, newExisting]);

  const handleSelectPatient = async (patientId: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const detail = await getPatientRisk(patientId);
      setSelectedPatient(detail);
    } catch {
      // drawer displays skeleton
    } finally {
      setDrawerLoading(false);
    }
  };

  if (error) return <ErrorState onRetry={load} />;

  return (
    <>
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
            <h1 className="text-page-title">Journey Risk Monitor</h1>
            <p
              className="text-body"
              style={{ color: "var(--color-text-secondary)", marginTop: 4 }}
            >
              Identify active patients who may drop next.
            </p>
          </div>
          <FilterBar show={["region", "insurance", "newExisting"]} />
        </div>

        {/* ── ANALYZE A PATIENT SECTION ───────────────────────── */}
        <div className="card" style={{ borderLeft: "4px solid var(--color-teal)" }}>
          <h3 className="text-section-title" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Users size={16} color="var(--color-teal)" />
            ANALYZE A PATIENT
          </h3>

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Input field */}
            <div style={{ display: "flex", gap: 8, flex: "1 1 240px", maxWidth: 360 }}>
              <input
                type="text"
                placeholder="Enter Patient ID (e.g. PT-10001)"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: 13,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--control-radius)",
                  outline: "none",
                  background: "var(--color-surface)",
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={lookupLoading}
                className="btn-primary"
                style={{ background: "var(--color-teal)", padding: "0 14px", fontSize: 13, gap: 4 }}
              >
                {lookupLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Search size={13} />
                )}
                <span>Analyze Risk</span>
              </button>
            </div>

            {/* Results output */}
            <div style={{ flex: "2 1 400px", minHeight: 40 }}>
              {lookupLoading ? (
                <div style={{ color: "var(--color-text-secondary)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, paddingTop: 8 }}>
                  <Loader2 size={14} className="animate-spin" /> Running ML predictive risk assessment models...
                </div>
              ) : lookupError ? (
                <div style={{ color: "var(--color-danger)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, paddingTop: 8 }}>
                  <AlertTriangle size={14} /> {lookupError}
                </div>
              ) : lookupResult ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: 12,
                    background: "var(--color-bg)",
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <div className="text-meta" style={{ fontSize: 9 }}>Risk Score</div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color:
                          lookupResult.risk_category === "HIGH"
                            ? "var(--color-danger)"
                            : lookupResult.risk_category === "MEDIUM"
                            ? "var(--color-warning)"
                            : "var(--color-success)",
                      }}
                    >
                      {lookupResult.risk_score}%
                    </div>
                  </div>

                  <div>
                    <div className="text-meta" style={{ fontSize: 9 }}>Risk Level</div>
                    <div style={{ marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 8,
                          background:
                            lookupResult.risk_category === "HIGH"
                              ? "var(--color-risk-high-bg)"
                              : lookupResult.risk_category === "MEDIUM"
                              ? "var(--color-risk-medium-bg)"
                              : "var(--color-risk-low-bg)",
                          color:
                            lookupResult.risk_category === "HIGH"
                              ? "var(--color-risk-high)"
                              : lookupResult.risk_category === "MEDIUM"
                              ? "var(--color-risk-medium)"
                              : "var(--color-risk-low)",
                        }}
                      >
                        {lookupResult.risk_category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-meta" style={{ fontSize: 9 }}>Current Stage</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-navy)", marginTop: 2 }}>
                      {lookupResult.current_stage}
                    </div>
                  </div>

                  <div>
                    <div className="text-meta" style={{ fontSize: 9 }}>Last Prediction</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                      {lookupResult.last_updated || new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: "var(--color-text-muted)", fontSize: 13, paddingTop: 8 }}>
                  Enter a Patient ID above and click Analyze Risk.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ACTIVE RISK MONITOR TITLE ───────────────────────── */}
        <div style={{ marginTop: 10 }}>
          <h2 className="text-section-title" style={{ fontSize: 16, fontWeight: 700, color: "var(--color-navy)" }}>
            ACTIVE RISK MONITOR
          </h2>
        </div>

        {/* ── KPI Row (Active Patient Partition) ──────────────── */}
        {loading || !kpis ? (
          <KPIGridSkeleton count={4} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <KPICard
              label="Active Patients"
              value={formatNumber(kpis.active_patients)}
              deltaLabel="in journey pipeline"
              icon={<Users size={16} />}
              tone="default"
            />
            <KPICard
              label="High Risk (Score ≥ 70)"
              value={formatNumber(kpis.high_risk)}
              deltaLabel="immediate attention"
              icon={<ShieldAlert size={16} />}
              tone="danger"
            />
            <KPICard
              label="Medium Risk (Score 40–69)"
              value={formatNumber(kpis.medium_risk)}
              deltaLabel="monitor & evaluate"
              icon={<AlertTriangle size={16} />}
              tone="warning"
            />
            <KPICard
              label="Low Risk (Score < 40)"
              value={formatNumber(kpis.low_risk)}
              deltaLabel="routine tracking"
              icon={<ShieldCheck size={16} />}
              tone="success"
            />
          </div>
        )}

        {/* ── Row: Risk Distribution + AI Risk Insights ───────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          {loading ? (
            <ChartSkeleton height={240} />
          ) : (
            <Card
              title="Active Risk Distribution"
              subtitle={`Breakdown of active pipeline (${kpis ? formatNumber(kpis.active_patients) : 1930} patients) by predicted drop-off propensity`}
            >
              <RiskDistributionChart data={distribution} />
            </Card>
          )}

          <Card
            title="Early Warning &amp; Triage Decision Rules"
            subtitle="Operational decision thresholds for patient services intervention workflows"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: "var(--color-danger-bg)",
                  border: "1px solid #FECACA",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--color-danger)", fontSize: 13 }}>
                  HIGH RISK (Score ≥ 70)
                </div>
                <div className="text-meta" style={{ marginTop: 2, color: "var(--color-text-primary)" }}>
                  Immediate attention recommended. High probability of drop-off within 7 days due to extended PA processing delay or prior rejection history.
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: "var(--color-warning-bg)",
                  border: "1px solid #FED7AA",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--color-warning)", fontSize: 13 }}>
                  MEDIUM RISK (Score 40–69)
                </div>
                <div className="text-meta" style={{ marginTop: 2, color: "var(--color-text-primary)" }}>
                  Monitor and evaluate intervention opportunities. Proactively assess copay assistance eligibility.
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: "var(--color-success-bg)",
                  border: "1px solid #BBF7D0",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--color-success)", fontSize: 13 }}>
                  LOW RISK (Score &lt; 40)
                </div>
                <div className="text-meta" style={{ marginTop: 2, color: "var(--color-text-primary)" }}>
                  Continue routine monitoring. Standard automated fulfillment workflow progressing normally.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Priority Intervention Queue Table ────────────────── */}
        {loading ? (
          <ChartSkeleton height={320} />
        ) : (
          <Card
            title="Priority Intervention Queue"
            subtitle="Sorted by highest drop-off risk score. Click any patient to inspect their journey timeline and SHAP explanation."
          >
            <RiskTable
              patients={patients}
              onSelectPatient={handleSelectPatient}
            />
          </Card>
        )}
      </div>

      {/* ── Patient Risk Detail Drawer ────────────────────────── */}
      <PatientRiskDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        patientDetail={selectedPatient}
        loading={drawerLoading}
      />
    </>
  );
}

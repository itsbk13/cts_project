"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getGlobalSHAP, getPatientSHAP } from "@/lib/api";
import type { GlobalSHAPImportance, PatientSHAPExplanation } from "@/types/risk";

import { Card } from "@/components/common/Card";
import { ErrorState } from "@/components/common/ErrorState";
import { ChartSkeleton } from "@/components/common/LoadingSkeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { GlobalSHAPChart } from "@/components/shap/GlobalSHAPChart";
import { PatientSHAPWaterfall } from "@/components/shap/PatientSHAPWaterfall";
import { User, Sparkles, Search, Loader2 } from "lucide-react";
import { useDatasetStore } from "@/store/datasetStore";
import { useFilterStore } from "@/store/filterStore";

// ============================================================
// Page 7 — Explainability (Model Transparency)
// Purpose: "Understand the factors contributing to the model's risk prediction."
// ============================================================

export default function ShapPage() {
  const [globalData, setGlobalData] = useState<GlobalSHAPImportance[]>([]);
  const [patientData, setPatientData] = useState<PatientSHAPExplanation | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { metadata } = useDatasetStore();
  const lastUpdated = metadata.last_updated;
  const { region, diagnosis, insurance, provider, newExisting } = useFilterStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [globalRes, patientRes] = await Promise.all([
        getGlobalSHAP(),
        selectedPatientId ? getPatientSHAP(selectedPatientId) : Promise.resolve(null),
      ]);
      setGlobalData(globalRes);
      
      if (selectedPatientId && !patientRes) {
        setError(true);
        setPatientData(null);
      } else {
        setPatientData(patientRes);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    load();
  }, [load, region, diagnosis, insurance, provider, newExisting]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSelectedPatientId(searchInput.trim());
    }
  };

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
        <h2 style={{ fontSize: 18, color: "var(--color-navy)", marginBottom: 10 }}>Patient Does Not Exist</h2>
        <p>The patient ID "{selectedPatientId}" could not be found in the system. Please try a valid patient ID.</p>
        <button onClick={() => { setError(false); setSearchInput(""); setSelectedPatientId(""); }} className="btn-primary" style={{ marginTop: 20 }}>
          Clear Search
        </button>
      </div>
    );
  }

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
          <h1 className="text-page-title">Why Is This Patient At Risk?</h1>
          <p className="text-body" style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>
            Understand the factors contributing to the model's risk prediction.
          </p>
        </div>

        {/* Patient Selector Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <User size={16} color="var(--color-teal)" />
          <span className="text-meta" style={{ fontWeight: 600 }}>Analyze Patient:</span>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              placeholder="e.g. PT-10001"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                border: "1px solid var(--color-teal)",
                borderRadius: "var(--control-radius)",
                background: "var(--color-primary-light)",
                color: "var(--color-navy)",
                outline: "none",
                width: 140,
              }}
            />
            <button
              onClick={handleSearch}
              className="btn-primary"
              style={{ background: "var(--color-teal)", padding: "0 12px", fontSize: 13, gap: 4 }}
            >
              <Search size={13} />
              <span>Explain</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Patient Risk Score Summary Header Card ───────────── */}
      {patientData && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: "var(--color-surface)",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            borderLeft: `4px solid ${patientData.predicted_risk >= 0.7 ? "var(--color-danger)" : patientData.predicted_risk >= 0.4 ? "var(--color-warning)" : "var(--color-success)"}`,
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <span className="text-meta">Subject ID</span>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-navy)", marginTop: 2 }}>
                {patientData.patient_id}
              </div>
            </div>

            <div style={{ height: 26, width: 1, background: "var(--color-border)" }} />

            <div>
              <span className="text-meta">Model Predicted Risk</span>
              <div style={{ fontSize: 19, fontWeight: 700, color: patientData.predicted_risk >= 0.7 ? "var(--color-danger)" : "var(--color-warning)", marginTop: 2 }}>
                {(patientData.predicted_risk * 100).toFixed(0)}%
              </div>
            </div>

            <div style={{ height: 26, width: 1, background: "var(--color-border)" }} />

            <div>
              <span className="text-meta">Risk Category</span>
              <div style={{ marginTop: 3 }}>
                <StatusBadge
                  label={patientData.predicted_risk >= 0.7 ? "HIGH" : patientData.predicted_risk >= 0.4 ? "MEDIUM" : "LOW"}
                  variant="risk"
                  riskCategory={patientData.predicted_risk >= 0.7 ? "HIGH" : patientData.predicted_risk >= 0.4 ? "MEDIUM" : "LOW"}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", fontSize: 12 }}>
            <Sparkles size={14} color="var(--color-teal)" />
            <span>TreeSHAP additive attribution verified</span>
          </div>
        </div>
      )}

      {/* ── MAIN: Patient Risk Attribution Waterfall ─────────── */}
      {loading ? (
        <ChartSkeleton height={380} />
      ) : !patientData ? (
        <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
          Enter a Patient ID above and click Explain to view their specific SHAP risk attributions.
        </div>
      ) : (
        <Card
          title={`Individual Feature Contributions: ${patientData.patient_id}`}
          subtitle="Feature attribution showing how clinical, operational, and payer features pushed risk relative to baseline"
        >
          <PatientSHAPWaterfall explanation={patientData} />
        </Card>
      )}

      
</div>
  );
}

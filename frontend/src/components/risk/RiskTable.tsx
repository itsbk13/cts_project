"use client";

import React, { useState } from "react";
import type { RiskPatient } from "@/types/risk";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Search, ChevronRight, ArrowUpDown, Filter, SlidersHorizontal } from "lucide-react";

// ============================================================
// RiskTable — Operational Intervention Workspace Table
// Filter by Risk Tier, Min Score, Stage, Region, Insurance
// ============================================================

interface RiskTableProps {
  patients: RiskPatient[];
  onSelectPatient: (patientId: string) => void;
}

export function RiskTable({ patients, onSelectPatient }: RiskTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskCategoryFilter, setRiskCategoryFilter] = useState<string>("HIGH_ONLY");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [minScore, setMinScore] = useState<number>(0);
  const [sortField, setSortField] = useState<"risk_score" | "days_in_current_stage">("risk_score");
  const [sortAsc, setSortAsc] = useState(false);

  // Filter logic
  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.top_risk_driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.region.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      riskCategoryFilter === "ALL"
        ? true
        : riskCategoryFilter === "HIGH_ONLY"
        ? p.risk_category === "HIGH"
        : p.risk_category === riskCategoryFilter;

    const matchesStage = stageFilter === "ALL" || p.current_stage === stageFilter;
    const matchesMinScore = p.risk_score >= minScore;

    return matchesSearch && matchesCategory && matchesStage && matchesMinScore;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: "risk_score" | "days_in_current_stage") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getRecommendedAction = (p: RiskPatient) => {
    if (p.risk_score >= 80) return "Immediate Outreach & PA Escalation";
    if (p.risk_score >= 60) return "Copay Assistance Verification";
    return "Standard Workflow Tracking";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── Operational Filter Controls ─────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "12px 14px",
          background: "var(--color-bg)",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ position: "relative", minWidth: 260 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Filter Patient ID, Driver, Region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 32px",
              fontSize: 13,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--control-radius)",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Quick High-Risk Filter Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="text-meta" style={{ fontWeight: 600 }}>Triage:</span>
            <select
              value={riskCategoryFilter}
              onChange={(e) => setRiskCategoryFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: "var(--control-radius)",
                border: "1px solid var(--color-border)",
                background: riskCategoryFilter === "HIGH_ONLY" ? "var(--color-danger-bg)" : "var(--color-surface)",
                color: riskCategoryFilter === "HIGH_ONLY" ? "var(--color-danger)" : "var(--color-text-secondary)",
                outline: "none",
              }}
            >
              <option value="HIGH_ONLY">⚠️ High Risk Only (&ge;70%)</option>
              <option value="ALL">All Risk Tiers</option>
              <option value="MEDIUM">Medium Risk (40–69%)</option>
              <option value="LOW">Low Risk (&lt;40%)</option>
            </select>
          </div>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              borderRadius: "var(--control-radius)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-secondary)",
              outline: "none",
            }}
          >
            <option value="ALL">All Journey Stages</option>
            <option value="Prescription">Prescription</option>
            <option value="Prior Authorization">Prior Authorization</option>
            <option value="Copay">Copay</option>
          </select>

          {/* Minimum Risk Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
            <span className="text-meta">Min Score: {minScore}%</span>
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{ width: 80, cursor: "pointer" }}
            />
          </div>
        </div>
      </div>

      {/* ── Patient Worklist Table ──────────────────────────── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Patient ID
              </th>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Current Stage
              </th>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("days_in_current_stage")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Days in Stage
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
                onClick={() => handleSort("risk_score")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Risk Score
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Risk Category
              </th>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Top Risk Driver
              </th>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Recommended Action
              </th>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "right",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Triage
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No patients match the current risk thresholds. Adjust minimum score or stage filters.
                </td>
              </tr>
            ) : (
              sorted.map((patient) => (
                <tr
                  key={patient.patient_id}
                  onClick={() => onSelectPatient(patient.patient_id)}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "var(--color-bg)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "")}
                >
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--color-primary)" }}>
                    {patient.patient_id}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {patient.current_stage}
                  </td>
                  <td style={{ padding: "12px 14px", color: patient.days_in_current_stage > 10 ? "var(--color-danger)" : "var(--color-text-secondary)", fontWeight: 600 }}>
                    {patient.days_in_current_stage} days
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 48,
                          height: 6,
                          background: "var(--color-border)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${patient.risk_score}%`,
                            background:
                              patient.risk_category === "HIGH"
                                ? "var(--color-danger)"
                                : patient.risk_category === "MEDIUM"
                                ? "var(--color-warning)"
                                : "var(--color-success)",
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>
                        {patient.risk_score}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <StatusBadge
                      label={patient.risk_category}
                      variant="risk"
                      riskCategory={patient.risk_category}
                      size="sm"
                    />
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-text-secondary)" }}>
                    {patient.top_risk_driver}
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {getRecommendedAction(patient)}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <button
                      className="btn-ghost"
                      style={{ padding: "4px 8px", fontSize: 12, gap: 4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient(patient.patient_id);
                      }}
                    >
                      <span>Explain</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

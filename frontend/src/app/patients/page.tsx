"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  ClipboardPen,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { getPatientList } from "@/services/patientApi";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import type { PatientListItem, RiskCategory } from "@/types/patient";

// ============================================================
// Patient List Page
// Route: /patients
// Lists all registered patients with search, risk badge, and
// links to patient detail + journey event entry.
// ============================================================

const RISK_STYLE: Record<RiskCategory, { color: string; bg: string; border: string }> = {
  HIGH:   { color: "var(--color-risk-high)",   bg: "var(--color-risk-high-bg)",   border: "#FECACA" },
  MEDIUM: { color: "var(--color-risk-medium)", bg: "var(--color-risk-medium-bg)", border: "#FED7AA" },
  LOW:    { color: "var(--color-risk-low)",    bg: "var(--color-risk-low-bg)",    border: "#BBF7D0" },
};

function RiskBadge({ level }: { level: RiskCategory }) {
  const s = RISK_STYLE[level];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {level}
    </span>
  );
}

export default function PatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getPatientList();
      setPatients(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = patients.filter(
    (p) =>
      search === "" ||
      p.patient_id.toLowerCase().includes(search.toLowerCase()) ||
      p.region.toLowerCase().includes(search.toLowerCase()) ||
      p.insurance.toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <ErrorState onRetry={load} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Page Actions ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 360 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            id="patient-search"
            type="text"
            placeholder="Search by Patient ID, Region, Insurance…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              fontSize: 13,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={load}
            className="btn-secondary"
            style={{ gap: 6, padding: "8px 12px", fontSize: 13 }}
            title="Refresh patient list"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <Link
            href="/patients/register"
            className="btn-primary"
            style={{
              gap: 6,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              background: "var(--color-teal)",
            }}
          >
            <UserPlus size={14} />
            <span>Register Patient</span>
          </Link>
        </div>
      </div>

      {/* ── Context Info Banner ────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: 6,
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              padding: "2px 6px",
              borderRadius: 4,
              background: "var(--color-primary-light)",
              color: "var(--color-teal)",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "0.04em",
            }}
          >
            LIVE PATIENT RECORDS
          </span>
          <span style={{ color: "var(--color-text-secondary)" }}>
            Active hospital records. Distinct from the 5,000-patient analytics model population.
          </span>
        </div>
      </div>

      {/* ── Patient Table ─────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.6fr 1fr 1fr 1.5fr 0.8fr 0.9fr 1fr",
            padding: "10px 18px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg)",
          }}
        >
          {["Patient ID", "Age", "Region", "Insurance", "Current Stage", "Risk Score", "Risk Level", "Actions"].map((h) => (
            <div
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={36} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No patients found"
            message={search ? "Try a different search term." : "Register your first patient to get started."}
          />
        ) : (
          filtered.map((patient, idx) => (
            <div
              key={patient.patient_id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.6fr 1fr 1fr 1.5fr 0.8fr 0.9fr 1fr",
                padding: "12px 18px",
                borderBottom: idx < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                alignItems: "center",
                background: "var(--color-surface)",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-navy)", fontFamily: "monospace" }}>
                {patient.patient_id}
              </div>
              <div style={{ fontSize: 13 }}>{patient.age}</div>
              <div style={{ fontSize: 13 }}>{patient.region}</div>
              <div style={{ fontSize: 13 }}>{patient.insurance}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    patient.current_stage === "Prior Authorization"
                      ? "var(--color-danger)"
                      : "var(--color-text-primary)",
                }}
              >
                {patient.current_stage}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: RISK_STYLE[patient.risk_level].color,
                }}
              >
                {patient.risk_score}%
              </div>
              <div>
                <RiskBadge level={patient.risk_level} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Link
                  href={`/patients/${patient.patient_id}`}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--color-teal)",
                    textDecoration: "none",
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  View <ChevronRight size={11} />
                </Link>
                <Link
                  href={`/journey/event?patient_id=${patient.patient_id}`}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "white",
                    textDecoration: "none",
                    padding: "4px 8px",
                    borderRadius: 4,
                    background: "var(--color-teal)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    whiteSpace: "nowrap",
                  }}
                >
                  <ClipboardPen size={11} /> Update
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Count footer */}
      {!loading && filtered.length > 0 && (
        <div className="text-meta" style={{ fontSize: 12 }}>
          Showing {filtered.length} of {patients.length} patient{patients.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
        </div>
      )}
    </div>
  );
}

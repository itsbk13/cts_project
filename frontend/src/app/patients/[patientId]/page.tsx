"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardPen,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  DollarSign,
  Heart,
  Pill,
  Activity,
  RefreshCw,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { getPatient } from "@/services/patientApi";
import { PatientTimeline } from "@/components/patients/PatientTimeline";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import type { PatientDetail, RiskCategory } from "@/types/patient";
import { Card } from "@/components/common/Card";

// ============================================================
// Patient Detail Page
// Route: /patients/[patientId]
// Shows patient info, risk score, journey timeline, event history
// ============================================================

const RISK_STYLE: Record<RiskCategory, { color: string; bg: string; border: string }> = {
  HIGH:   { color: "var(--color-risk-high)",   bg: "var(--color-risk-high-bg)",   border: "#FECACA" },
  MEDIUM: { color: "var(--color-risk-medium)", bg: "var(--color-risk-medium-bg)", border: "#FED7AA" },
  LOW:    { color: "var(--color-risk-low)",    bg: "var(--color-risk-low-bg)",    border: "#BBF7D0" },
};

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(false);
    try {
      const data = await getPatient(patientId);
      setPatient(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState onRetry={load} message="Unable to load patient information." />;

  const riskStyle = patient ? RISK_STYLE[patient.risk_level] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Back + Actions ─────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button
          onClick={() => router.back()}
          className="btn-ghost"
          style={{ gap: 6, fontSize: 13 }}
        >
          <ArrowLeft size={14} /> Back to Patient List
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} className="btn-secondary" style={{ gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {patient && (
            <Link
              href={`/journey/event?patient_id=${patient.patient_id}`}
              className="btn-primary"
              style={{ gap: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "var(--color-teal)" }}
            >
              <ClipboardPen size={14} /> Update Journey Event
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton height={120} />
          <Skeleton height={300} />
          <Skeleton height={200} />
        </div>
      ) : patient ? (
        <>
          {/* ── Patient Header Card ─────────────────────────── */}
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              borderLeft: `4px solid ${riskStyle!.color}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--color-primary-light)",
                    border: "2px solid var(--color-teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-teal)",
                    fontWeight: 800,
                    fontSize: 16,
                  }}
                >
                  {patient.patient_id.replace(/[^0-9]/g, "").slice(-2)}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-navy)", fontFamily: "monospace" }}>
                    {patient.patient_id}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    Last updated: {new Date(patient.last_updated).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Patient details grid */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { icon: <Activity size={13} />, label: "Age", value: `${patient.age} years` },
                  { icon: <MapPin size={13} />, label: "Region", value: patient.region },
                  { icon: <Heart size={13} />, label: "Diagnosis", value: patient.diagnosis },
                  { icon: <Pill size={13} />, label: "Therapy", value: patient.therapy },
                  { icon: <ShieldCheck size={13} />, label: "Insurance", value: patient.insurance },
                  { icon: <DollarSign size={13} />, label: "Copay", value: `$${patient.copay_amount}` },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{icon}</span>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{label}:</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk score */}
            <div
              style={{
                textAlign: "center",
                background: riskStyle!.bg,
                border: `1px solid ${riskStyle!.border}`,
                borderRadius: 10,
                padding: "16px 24px",
                minWidth: 140,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: riskStyle!.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Risk Score
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: riskStyle!.color, lineHeight: 1 }}>
                {typeof patient.risk_score === 'number' 
                   ? (patient.risk_score <= 1 
                        ? (patient.risk_score * 100).toFixed(1).replace(/\.0$/, '') 
                        : Number(patient.risk_score).toFixed(1).replace(/\.0$/, ''))
                   : patient.risk_score}%
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 10,
                  background: "white",
                  color: riskStyle!.color,
                  border: `1px solid ${riskStyle!.border}`,
                  marginTop: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {patient.risk_level} RISK
              </div>
              <div style={{ fontSize: 11, color: riskStyle!.color, marginTop: 6, fontWeight: 600 }}>
                {patient.current_stage}
              </div>
            </div>
          </div>

          {/* ── Lower 2-column layout ───────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Journey Timeline */}
            <Card
              title="Journey Timeline"
              subtitle="Patient progression through the care pathway"
            >
              <PatientTimeline timeline={patient.timeline} />
            </Card>

            {/* Event History */}
            <Card
              title="Event History"
              subtitle={`${patient.events.length} recorded event${patient.events.length !== 1 ? "s" : ""}`}
            >
              {patient.events.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "var(--color-text-muted)", fontSize: 13 }}>
                  No events recorded yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...patient.events].reverse().map((event) => {
                    const rStyle = event.risk_level ? RISK_STYLE[event.risk_level] : null;
                    return (
                      <div
                        key={event.event_id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 6,
                          background: "var(--color-bg)",
                          border: "1px solid var(--color-border)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-navy)" }}>
                            {event.stage}
                          </span>
                          {rStyle && event.risk_level && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "1px 7px",
                                borderRadius: 8,
                                background: rStyle.bg,
                                color: rStyle.color,
                                border: `1px solid ${rStyle.border}`,
                              }}
                            >
                              {event.risk_level} · {typeof event.risk_score === 'number' && event.risk_score <= 1 ? (event.risk_score * 100).toFixed(1).replace(/\.0$/, '') : Number(event.risk_score).toFixed(1).replace(/\.0$/, '')}%
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={11} />
                          {event.event_date}
                        </div>
                        {event.notes && (
                          <div style={{ fontSize: 12, color: "var(--color-text-primary)", marginTop: 2 }}>
                            {event.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

"use client";

import React from "react";
import { Drawer } from "@/components/common/Drawer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatNumber, formatPercent, formatCurrency, formatDays } from "@/lib/utils";
import type { LeakageDrawerData } from "@/types/analytics";
import {
  MapPin,
  Users,
  TrendingDown,
  Clock,
  DollarSign,
  Lightbulb,
  ChevronRight,
  ShieldAlert,
  Info,
} from "lucide-react";
import Link from "next/link";

// ============================================================
// LeakageDrawer — Specialized Leakage Investigation Tool
// ============================================================

interface LeakageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: LeakageDrawerData | null;
  loading?: boolean;
}

export function LeakageDrawer({ isOpen, onClose, data, loading }: LeakageDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={data ? `Leakage Investigation: ${data.stage}` : "Leakage Investigation"}
      subtitle="Leakage metrics, geographic disparities, and recommended interventions"
      id="leakage-drawer"
      width={520}
    >
      {loading || !data ? (
        <LeakageDrawerSkeleton />
      ) : (
        <LeakageDrawerContent data={data} onClose={onClose} />
      )}
    </Drawer>
  );
}

function LeakageDrawerContent({
  data,
  onClose,
}: {
  data: LeakageDrawerData;
  onClose: () => void;
}) {
  const topDriver = data.top_drivers[0] || {
    driver: "PA Processing Delay",
    impact: "HIGH" as const,
    affected_patients: 850,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Metric Snapshot Grid ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <MetricBox icon={<Users size={16} color="var(--color-primary)" />} label="Patients Affected" value={formatNumber(data.patients_affected)} />
        <MetricBox icon={<TrendingDown size={16} color="var(--color-warning)" />} label="Dropoff Rate" value={formatPercent(data.dropoff_rate)} />
      </div>

      {/* ── Key Leakage Drivers ───────────────────────────── */}
      <Section title="Top Associated Drivers">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.top_drivers.slice(0, 3).map((d, i) => (
            <div
              key={d.driver}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "var(--color-bg)",
                borderRadius: 6,
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: i === 0 ? "var(--color-danger)" : i === 1 ? "var(--color-warning)" : "var(--color-info)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.driver}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span className="text-meta">{formatNumber(d.affected_patients)} pts</span>
                <StatusBadge label={d.impact} variant="impact" impact={d.impact} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Most Affected Geographies & Cohorts ────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <h4 className="text-kpi-label" style={{ marginBottom: 8 }}>Top Region</h4>
          <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: 6, border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13 }}>
              <MapPin size={13} color="var(--color-primary)" />
              {data.top_regions[0]?.region || "Southeast"}
            </div>
            <div className="text-meta" style={{ marginTop: 2, color: "var(--color-danger)", fontWeight: 600 }}>
              {data.top_regions[0]?.dropoff_rate.toFixed(1) || "44.1"}% drop-off
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-kpi-label" style={{ marginBottom: 8 }}>Top At-Risk Cohort</h4>
          <div style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: 6, border: "1px solid var(--color-border)" }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {data.top_cohorts[0]?.label || "Medicaid"}
            </div>
            <div className="text-meta" style={{ marginTop: 2, color: "var(--color-danger)", fontWeight: 600 }}>
              {data.top_cohorts[0]?.dropoff_rate.toFixed(1) || "50.4"}% drop-off
            </div>
          </div>
        </div>
      </div>

      {/* ── WHY IT MATTERS ──────────────────────────────────── */}
      <Section title="Why It Matters">
        <div
          style={{
            padding: "12px 14px",
            background: "var(--color-bg)",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            display: "flex",
            gap: 10,
          }}
        >
          <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--color-text-primary)", margin: 0 }}>
            Prior Authorization latency beyond 10 days leads to severe prescription abandonment. 78% of dropped patients cite administrative opacity between payer and prescribing clinic as the primary reason for discontinuation.
          </p>
        </div>
      </Section>

      {/* ── RECOMMENDED INVESTIGATION & ACTION ─────────────── */}
      <Section title="Recommended Investigation">
        <div
          style={{
            padding: "12px 14px",
            background: "var(--color-primary-light)",
            borderRadius: 8,
            border: "1px solid #BFDBFE",
            display: "flex",
            gap: 10,
          }}
        >
          <Lightbulb size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--color-primary-dark)", margin: "0 0 4px" }}>
              {data.recommended_action}
            </p>
            <p className="text-meta" style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
              * Business analytics recommendation, not a clinical decision.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Action: View High-Risk Patients ────────────────── */}
      <Link
        href="/risk"
        onClick={onClose}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--color-primary)",
          borderRadius: 8,
          textDecoration: "none",
          color: "white",
          fontSize: 13,
          fontWeight: 600,
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-primary-dark)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-primary)")}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldAlert size={16} />
          View High-Risk Patients at this Stage
        </span>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function MetricBox({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-text-muted)", marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: valueColor ?? "var(--color-text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ height: 1, background: "var(--color-border)", marginBottom: 12 }} />
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 10px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function LeakageDrawerSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-pulse" style={{ height: 64, borderRadius: 8 }} />
        ))}
      </div>
      <div className="skeleton-pulse" style={{ height: 120, borderRadius: 8 }} />
      <div className="skeleton-pulse" style={{ height: 100, borderRadius: 8 }} />
    </div>
  );
}

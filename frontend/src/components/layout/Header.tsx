"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Database,
  Filter,
  X,
  Upload,
  User,
  Building2,
  LogOut,
} from "lucide-react";
import { useDatasetStore } from "@/store/datasetStore";
import { useFilterStore } from "@/store/filterStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { formatNumber } from "@/lib/utils";

// ============================================================
// Top Header — Minimal Enterprise Bar with Session & Logout
// ============================================================

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Patient Journey Command Center",
    subtitle: "Real-time visibility into patient progression, leakage, and journey risk",
  },
  "/patients": {
    title: "Patient List",
    subtitle: "View and search all registered patients",
  },
  "/patients/register": {
    title: "Register Patient",
    subtitle: "Enroll a new patient into the journey intelligence system",
  },
  "/journey/event": {
    title: "Journey Event Entry",
    subtitle: "Update a patient's journey stage, get instant risk prediction, and save the event",
  },
  "/funnel": {
    title: "Journey Analytics",
    subtitle: "Trace patient progression and identify where journey friction occurs",
  },
  "/cohorts": {
    title: "Cohort Intelligence",
    subtitle: "Compare journey outcomes across patient segments and regions",
  },
  "/leakage": {
    title: "Leakage Intelligence",
    subtitle: "Understand why patients leave the journey",
  },
  "/survival": {
    title: "Survival Analytics",
    subtitle: "Understand when patients are most likely to drop off",
  },
  "/risk": {
    title: "Journey Risk Monitor",
    subtitle: "Identify active patients who may drop next",
  },
  "/shap": {
    title: "Why Is This Patient At Risk?",
    subtitle: "Understand the factors contributing to the model's risk prediction",
  },
  "/ai": {
    title: "Patient Journey AI Copilot",
    subtitle: "Ask questions about your patient journey analytics",
  },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { metadata } = useDatasetStore();
  const { hasActiveFilters, resetFilters } = useFilterStore();
  const { openDatasetModal } = useUIStore();
  const { session, logout } = useAuthStore();

  const current = PAGE_TITLES[pathname] || PAGE_TITLES["/"];
  const isFiltered = hasActiveFilters();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header
      style={{
        height: "var(--header-height)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* ── Left: Page Breadcrumb / Title ──────────────────── */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-navy)", lineHeight: 1.2 }}>
          {current.title}
        </div>
        <div className="text-meta" style={{ fontSize: 11, marginTop: 1 }}>
          {current.subtitle}
        </div>
      </div>

      {/* ── Right: Dataset Status, Filters, Session & Logout ──── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Active Filter Badge with Reset */}
        {isFiltered && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              background: "var(--color-primary-light)",
              border: "1px solid #99F6E4",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-teal)",
            }}
          >
            <Filter size={12} />
            <span>Filters Active</span>
            <button
              onClick={resetFilters}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                color: "var(--color-danger)",
              }}
              title="Reset all filters"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Clickable Dataset Status Pill -> Opens DatasetModal */}
        <button
          onClick={openDatasetModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 12px",
            borderRadius: 20,
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-text-primary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-teal)";
            e.currentTarget.style.background = "var(--color-primary-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.background = "var(--color-bg)";
          }}
          title="Click to Upload / Change Dataset"
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--color-success)",
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600, color: "var(--color-navy)" }}>
            {metadata.isCustom ? "Active Data" : "Demo Dataset"}
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>•</span>
          <span style={{ color: "var(--color-text-secondary)" }}>
            {formatNumber(metadata.patient_count)} patients
          </span>
          <Upload size={12} color="var(--color-teal)" style={{ marginLeft: 2 }} />
        </button>

        {/* Direct Link to /ai Page */}
        <Link
          href="/ai"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 6,
            background: "var(--color-navy)",
            color: "white",
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-teal)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-navy)")}
        >
          <Sparkles size={13} />
          <span>AI Copilot</span>
        </Link>

        {/* Hospital / User Session Badge with Logout */}
        {session?.isAuthenticated && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 8px 4px 12px",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
            }}
          >
            <Building2 size={13} color="var(--color-teal)" />
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-navy)", lineHeight: 1.1 }}>
                {session.hospitalName || session.organization}
              </span>
              {session.hospitalId && (
                <span className="text-meta" style={{ fontSize: 10, color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                  {session.hospitalId}
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="btn-ghost"
              style={{
                padding: "4px 6px",
                color: "var(--color-danger)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
              }}
              title="Logout of workspace"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

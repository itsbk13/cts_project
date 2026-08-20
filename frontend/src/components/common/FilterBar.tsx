"use client";

import React from "react";
import { ChevronDown, X, SlidersHorizontal, Filter } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";
import { useDatasetStore } from "@/store/datasetStore";
import { formatNumber } from "@/lib/utils";
import {
  REGIONS,
  INSURANCE_TYPES,
  DIAGNOSIS_TYPES,
  PROVIDER_TYPES,
  NEW_EXISTING_OPTIONS,
} from "@/lib/constants";

// ============================================================
// FilterBar — global filter controls shared across pages
// ============================================================

interface FilterBarProps {
  /** Which filters to show — defaults to all */
  show?: Array<"region" | "diagnosis" | "insurance" | "provider" | "newExisting">;
}

export function FilterBar({ show }: FilterBarProps) {
  const {
    region, setRegion,
    diagnosis, setDiagnosis,
    insurance, setInsurance,
    provider, setProvider,
    newExisting, setNewExisting,
    hasActiveFilters, resetFilters,
  } = useFilterStore();

  const { metadata, overviewKPIs } = useDatasetStore();

  const visible = show ?? ["region", "diagnosis", "insurance", "provider", "newExisting"];

  const filters: {
    key: string;
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
  }[] = [
    { key: "region",     label: "Region",       value: region,     options: REGIONS,            onChange: setRegion     },
    { key: "diagnosis",  label: "Diagnosis",     value: diagnosis,  options: DIAGNOSIS_TYPES,    onChange: setDiagnosis  },
    { key: "insurance",  label: "Insurance",     value: insurance,  options: INSURANCE_TYPES,    onChange: setInsurance  },
    { key: "provider",   label: "Provider",      value: provider,   options: PROVIDER_TYPES,     onChange: setProvider   },
    { key: "newExisting",label: "Patient Type",  value: newExisting,options: NEW_EXISTING_OPTIONS,onChange: setNewExisting},
  ].filter((f) => visible.includes(f.key as never));

  const active = hasActiveFilters();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <SlidersHorizontal size={14} color="var(--color-text-muted)" />
        {active && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 4,
              background: "var(--color-primary-light)",
              color: "var(--color-primary-dark)",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Filter size={10} />
            Filtered: {formatNumber(overviewKPIs.total_patients)} of {formatNumber(metadata.patient_count)} patients
          </span>
        )}
      </div>

      {filters.map((f) => (
        <div key={f.key} style={{ position: "relative" }}>
          <select
            id={`filter-${f.key}`}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            aria-label={f.label}
            style={{
              appearance: "none",
              padding: "6px 28px 6px 10px",
              fontSize: 13,
              fontWeight: f.value !== "All" ? 600 : 400,
              color: f.value !== "All" ? "var(--color-primary)" : "var(--color-text-secondary)",
              background: f.value !== "All" ? "var(--color-primary-light)" : "var(--color-surface)",
              border: `1px solid ${f.value !== "All" ? "var(--color-primary)" : "var(--color-border)"}`,
              borderRadius: "var(--control-radius)",
              cursor: "pointer",
              outline: "none",
              fontFamily: "var(--font-family)",
            }}
          >
            <option value="All">{f.label}</option>
            {f.options.filter((o) => o !== "All").map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: f.value !== "All" ? "var(--color-primary)" : "var(--color-text-muted)",
            }}
          />
        </div>
      ))}

      {active && (
        <button
          className="btn-ghost"
          onClick={resetFilters}
          style={{ fontSize: 12, gap: 4, color: "var(--color-danger)", padding: "4px 8px" }}
          id="filter-bar-reset"
        >
          <X size={12} />
          Reset Filters
        </button>
      )}
    </div>
  );
}

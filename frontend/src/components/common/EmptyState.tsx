"use client";

import React from "react";
import { SearchX, FilterX } from "lucide-react";

// ============================================================
// EmptyState — shown when filters produce zero results
// ============================================================

interface EmptyStateProps {
  title?: string;
  message?: string;
  onClearFilters?: () => void;
}

export function EmptyState({
  title = "No data found",
  message = "No patient data matches the selected filters.",
  onClearFilters,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "48px 24px",
        textAlign: "center",
      }}
      role="status"
      aria-label={title}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--color-surface-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
        }}
      >
        <SearchX size={24} />
      </div>
      <div>
        <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
          {title}
        </p>
        <p className="text-meta" style={{ maxWidth: 320, margin: "0 auto" }}>
          {message}
        </p>
      </div>
      {onClearFilters && (
        <button className="btn-secondary" onClick={onClearFilters} id="empty-state-clear-filters">
          <FilterX size={14} />
          Clear Filters
        </button>
      )}
    </div>
  );
}

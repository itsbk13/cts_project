"use client";

import React from "react";

// ============================================================
// LoadingSkeleton — placeholder for loading states
// ============================================================

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  borderRadius?: number | string;
  className?: string;
}

export function Skeleton({ height = 16, width = "100%", borderRadius = 4, className = "" }: SkeletonProps) {
  return (
    <div
      className={`skeleton-pulse ${className}`}
      style={{ height, width, borderRadius }}
      aria-hidden="true"
    />
  );
}

// ── KPI grid skeleton ─────────────────────────────────────────

export function KPIGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton height={12} width="60%" />
          <div style={{ height: 8 }} />
          <Skeleton height={32} width="80%" />
          <div style={{ height: 8 }} />
          <Skeleton height={12} width="40%" />
        </div>
      ))}
    </div>
  );
}

// ── Chart skeleton ────────────────────────────────────────────

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="card" aria-busy="true" aria-label="Loading chart">
      <Skeleton height={18} width="40%" />
      <div style={{ height: 16 }} />
      <Skeleton height={height} width="100%" borderRadius={8} />
    </div>
  );
}

// ── Table skeleton ────────────────────────────────────────────

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: 16 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} width={`${Math.floor(100 / cols)}%`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            padding: "12px 16px",
            borderBottom: r < rows - 1 ? "1px solid var(--color-border)" : "none",
            display: "flex",
            gap: 16,
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={12} width={`${Math.floor(100 / cols)}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

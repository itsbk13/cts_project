"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

// ============================================================
// ErrorState — shown when an API request fails
// ============================================================

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load data",
  message = "Unable to load journey analytics. Please try again.",
  onRetry,
}: ErrorStateProps) {
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
      role="alert"
      aria-label={title}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--color-danger-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-danger)",
        }}
      >
        <AlertCircle size={24} />
      </div>
      <div>
        <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
          {title}
        </p>
        <p className="text-meta" style={{ maxWidth: 320, margin: "0 auto" }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry} id="error-state-retry">
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

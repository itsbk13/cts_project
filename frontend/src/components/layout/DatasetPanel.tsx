"use client";

import React, { useRef } from "react";
import {
  Upload,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Users,
  Columns,
  RefreshCw,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useDatasetStore } from "@/store/datasetStore";

// ============================================================
// DatasetPanel — persistent left sidebar
// Fully interactive: Uploads custom CSV/Excel files and instantly
// updates all dashboard views, funnels, charts, and models.
// ============================================================

export function DatasetPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { metadata, isLoading, error, uploadDataset, resetToDefault } = useDatasetStore();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadDataset(file);
      // Reset input value so re-uploading the same file works
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <aside
      aria-label="Dataset panel"
      style={{
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Database size={14} color="var(--color-text-secondary)" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-text-secondary)",
            }}
          >
            Dataset Control
          </span>
        </div>

        {/* Upload button */}
        <button
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleUploadClick}
          disabled={isLoading}
          id="dataset-upload-btn"
        >
          {isLoading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Upload size={13} />
              <span>Upload Dataset</span>
            </>
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv,.xls"
          style={{ display: "none" }}
          onChange={handleFileChange}
          aria-label="Upload patient dataset file"
        />
      </div>

      {/* Dataset status */}
      <div style={{ padding: "14px 16px", flex: 1 }}>
        {/* Error Alert if upload failed */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              marginBottom: 14,
              padding: "8px 10px",
              borderRadius: 6,
              background: "var(--color-danger-bg)",
              border: "1px solid #FECACA",
              fontSize: 12,
              color: "var(--color-danger)",
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Status indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
            padding: "8px 10px",
            borderRadius: 6,
            background: metadata.isCustom ? "var(--color-primary-light)" : "var(--color-success-bg)",
            border: `1px solid ${metadata.isCustom ? "#BFDBFE" : "#BBF7D0"}`,
          }}
        >
          {metadata.isCustom ? (
            <Sparkles size={13} color="var(--color-primary)" />
          ) : (
            <CheckCircle2 size={13} color="var(--color-success)" />
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: metadata.isCustom ? "var(--color-primary-dark)" : "var(--color-success)",
            }}
          >
            {metadata.status}
          </span>
        </div>

        {/* Metadata rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <MetaRow
            icon={<FileSpreadsheet size={12} />}
            label="File"
            value={metadata.filename}
            truncate
          />
          <MetaRow
            icon={<Users size={12} />}
            label="Patients"
            value={metadata.patient_count.toLocaleString()}
          />
          <MetaRow
            icon={<Columns size={12} />}
            label="Columns"
            value={String(metadata.column_count)}
          />
          <MetaRow
            label="Updated"
            value={metadata.last_updated}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--color-border)",
            margin: "16px 0",
          }}
        />

        {/* Action links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            className="btn-ghost"
            style={{ width: "100%", justifyContent: "flex-start", padding: "6px 0" }}
            onClick={handleUploadClick}
            id="dataset-replace-btn"
          >
            <RefreshCw size={12} />
            <span style={{ fontSize: 12 }}>Upload New File</span>
          </button>

          {metadata.isCustom && (
            <button
              className="btn-ghost"
              style={{ width: "100%", justifyContent: "flex-start", padding: "6px 0", color: "var(--color-text-secondary)" }}
              onClick={resetToDefault}
              id="dataset-reset-btn"
            >
              <Database size={12} />
              <span style={{ fontSize: 12 }}>Reset to Demo Dataset</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <p
          className="text-meta"
          style={{ fontSize: 10, color: "var(--color-text-muted)", lineHeight: 1.4 }}
        >
          Supports .csv, .xlsx, .xls files. All data is processed client-side in browser memory.
        </p>
      </div>
    </aside>
  );
}

// ── Meta row helper ───────────────────────────────────────────

function MetaRow({
  icon,
  label,
  value,
  truncate = false,
  valueColor,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
  valueColor?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {icon && (
          <span style={{ color: "var(--color-text-muted)", display: "flex" }}>
            {icon}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: valueColor ?? "var(--color-text-primary)",
          overflow: truncate ? "hidden" : undefined,
          textOverflow: truncate ? "ellipsis" : undefined,
          whiteSpace: truncate ? "nowrap" : undefined,
          paddingLeft: icon ? "16px" : 0,
        }}
        title={truncate ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}

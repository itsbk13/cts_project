"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  Database,
  FileSpreadsheet,
  Users,
  Columns,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
} from "lucide-react";
import { useDatasetStore } from "@/store/datasetStore";
import { useUIStore } from "@/store/uiStore";
import { formatNumber } from "@/lib/utils";

// ============================================================
// DatasetModal — Full Interactive Dataset Ingestion Modal
// Supports uploading custom CSV / Excel files and switching cohorts
// ============================================================

export function DatasetModal() {
  const { isDatasetModalOpen, closeDatasetModal } = useUIStore();
  const { metadata, isLoading, error, uploadDataset, resetToDefault } = useDatasetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isDatasetModalOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSuccessNotice(null);
      await uploadDataset(file);
      setSuccessNotice(`Successfully ingested "${file.name}" with dynamic funnel & risk recalculation.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSuccessNotice(null);
      await uploadDataset(file);
      setSuccessNotice(`Successfully ingested "${file.name}" with dynamic funnel & risk recalculation.`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(23, 43, 77, 0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDatasetModal();
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 580,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 12px 36px rgba(23, 43, 77, 0.20)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "var(--color-primary-light)",
                  color: "var(--color-teal)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Database size={18} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-navy)", margin: 0 }}>
                Dataset Ingestion &amp; Management
              </h2>
            </div>
            <p className="text-meta" style={{ marginTop: 4, marginLeft: 40 }}>
              Upload external patient journey files or inspect current pipeline metrics.
            </p>
          </div>

          <button
            onClick={closeDatasetModal}
            className="btn-ghost"
            style={{ padding: 6, color: "var(--color-text-muted)" }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Upload Error Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 6,
              background: "var(--color-danger-bg)",
              border: "1px solid #FECACA",
              fontSize: 13,
              color: "var(--color-danger)",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Success Alert */}
        {successNotice && !error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 6,
              background: "var(--color-success-bg)",
              border: "1px solid #BBF7D0",
              fontSize: 13,
              color: "var(--color-success)",
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragOver ? "var(--color-teal)" : "var(--color-border-strong)"}`,
            borderRadius: 8,
            padding: "28px 20px",
            textAlign: "center",
            background: isDragOver ? "var(--color-primary-light)" : "var(--color-bg)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-teal)",
            }}
          >
            {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-navy)" }}>
              {isLoading ? "Parsing and recalculating pipeline..." : "Click or drag & drop dataset file here"}
            </div>
            <div className="text-meta" style={{ marginTop: 2 }}>
              Supports CSV (`.csv`) and Excel (`.xlsx`, `.xls`) datasets
            </div>
          </div>
        </div>

        {/* Current Active Dataset Summary Card */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 8,
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Active Dataset Profile
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 12,
                background: metadata.isCustom ? "var(--color-primary-light)" : "var(--color-success-bg)",
                color: metadata.isCustom ? "var(--color-teal)" : "var(--color-success)",
                border: `1px solid ${metadata.isCustom ? "#99F6E4" : "#BBF7D0"}`,
              }}
            >
              {metadata.status}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
            <div>
              <span className="text-meta">File Name</span>
              <div style={{ fontWeight: 600, color: "var(--color-navy)", marginTop: 1, wordBreak: "break-all" }}>
                {metadata.filename}
              </div>
            </div>

            <div>
              <span className="text-meta">Patient Records</span>
              <div style={{ fontWeight: 700, color: "var(--color-teal)", marginTop: 1 }}>
                {formatNumber(metadata.patient_count)} journeys
              </div>
            </div>

            <div>
              <span className="text-meta">Columns Detected</span>
              <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginTop: 1 }}>
                {metadata.column_count} fields
              </div>
            </div>

            <div>
              <span className="text-meta">Ingestion Timestamp</span>
              <div style={{ fontWeight: 500, color: "var(--color-text-secondary)", marginTop: 1 }}>
                {metadata.last_updated}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px solid var(--color-border)" }}>
          {metadata.isCustom ? (
            <button
              onClick={resetToDefault}
              className="btn-ghost"
              style={{ color: "var(--color-danger)", fontSize: 12, gap: 5 }}
            >
              <RefreshCw size={12} />
              <span>Reset to Demo 5,000 Dataset</span>
            </button>
          ) : (
            <span className="text-meta" style={{ fontSize: 12 }}>
              Default benchmark 5,000-patient cohort active
            </span>
          )}

          <button
            onClick={closeDatasetModal}
            className="btn-primary"
            style={{ padding: "8px 18px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

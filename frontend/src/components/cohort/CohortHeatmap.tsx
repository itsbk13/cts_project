"use client";

import React from "react";
import type { CohortHeatmapCell } from "@/types/analytics";
import { formatNumber } from "@/lib/utils";

interface CohortHeatmapProps {
  data: CohortHeatmapCell[];
}

export function CohortHeatmap({ data }: CohortHeatmapProps) {
  if (!data || data.length === 0) return null;

  // Max retention array length
  const maxMonths = Math.max(...data.map(d => d.retention_rates.length), 0);
  const columns = Array.from({ length: maxMonths }, (_, i) => i);

  const getCellColor = (rate: number | null) => {
    if (rate === null || rate === undefined) return { bg: "transparent", text: "transparent" };
    if (rate >= 90) return { bg: "#1e3a8a", text: "#ffffff" }; // deepest blue
    if (rate >= 80) return { bg: "#1d4ed8", text: "#ffffff" }; // deep blue
    if (rate >= 70) return { bg: "#3b82f6", text: "#ffffff" }; // medium blue
    if (rate >= 60) return { bg: "#60a5fa", text: "#ffffff" }; // light blue
    if (rate >= 50) return { bg: "#93c5fd", text: "#1e293b" }; // lighter blue
    return { bg: "#bfdbfe", text: "#1e293b" }; // faint blue
  };

  return (
    <div style={{ overflowX: "auto", padding: "10px 0" }}>
      <table
        style={{
          borderCollapse: "collapse",
          fontSize: 13,
          width: "100%",
          minWidth: 700,
          background: "var(--color-surface)",
          borderRadius: 8,
          overflow: "hidden"
        }}
      >
        <thead>
          <tr>
            <th
              rowSpan={2}
              style={{
                width: 150,
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: 600,
                color: "#0f766e",
                background: "#f0fdfa",
                fontSize: 12,
                borderBottom: "1px solid #ccfbf1",
                verticalAlign: "bottom"
              }}
            >
              Account<br />Creation Date
            </th>
            <th
              rowSpan={2}
              style={{
                width: 120,
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: 600,
                color: "#0f766e",
                background: "#f0fdfa",
                fontSize: 12,
                borderBottom: "1px solid #ccfbf1",
                verticalAlign: "bottom"
              }}
            >
              # of Accounts<br />Created
            </th>
            <th
              colSpan={columns.length}
              style={{
                padding: "8px 10px",
                textAlign: "center",
                fontWeight: 600,
                color: "#0f766e",
                background: "#f0fdfa",
                fontSize: 13,
                borderBottom: "1px solid #ccfbf1"
              }}
            >
              Months Since Account Creation
            </th>
          </tr>
          <tr>
            {columns.map((m) => (
              <th
                key={m}
                style={{
                  padding: "8px 0",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#0f766e",
                  background: "#f0fdfa",
                  fontSize: 12,
                  minWidth: 45,
                  borderBottom: "1px solid #ccfbf1"
                }}
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={row.cohort_month}>
              <td
                style={{
                  padding: "12px 16px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  fontSize: 12,
                  background: rIdx % 2 === 0 ? "transparent" : "#f8fafc"
                }}
              >
                {row.cohort_month}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  fontSize: 13,
                  background: rIdx % 2 === 0 ? "transparent" : "#f8fafc"
                }}
              >
                {formatNumber(row.total_patients)}
              </td>
              {columns.map((cIdx) => {
                const rate = row.retention_rates[cIdx];
                const style = getCellColor(rate);
                
                return (
                  <td
                    key={cIdx}
                    style={{
                      padding: 0,
                      background: rIdx % 2 === 0 ? "transparent" : "#f8fafc"
                    }}
                  >
                    {rate !== null && rate !== undefined ? (
                      <div
                        style={{
                          background: style.bg,
                          color: style.text,
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: 12,
                          border: "1px solid rgba(255,255,255,0.1)",
                          margin: "1px"
                        }}
                      >
                        {rate}%
                      </div>
                    ) : (
                      <div style={{ height: 40, margin: "1px" }} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

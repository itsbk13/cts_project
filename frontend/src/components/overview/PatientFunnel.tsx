"use client";

import React, { useMemo } from "react";
import type { FunnelData } from "@/types/analytics";
import { formatNumber, formatPercent } from "@/lib/utils";

interface PatientFunnelProps {
  data: FunnelData;
  interactive?: boolean;
}

const COLORS = [
  "#FF5C5C", // Red
  "#52A5FF", // Blue
  "#FFAD33", // Yellow/Orange
  "#10B981", // Green
  "#F97316", // Orange
  "#6366F1", // Indigo/Purple
  "#339AF0"  // Extra
];

export function PatientFunnel({ data }: PatientFunnelProps) {
  const chartData = useMemo(() => {
    if (!data || !data.stages) return [];
    
    const maxCount = data.stages[0]?.patient_count || 1;
    
    return data.stages.map((s, idx) => {
      const nextCount = data.stages[idx + 1]?.patient_count || (s.patient_count * 0.5);
      
      return {
        name: s.stage,
        count: s.patient_count,
        nextCount: nextCount,
        dropoff: s.dropoff_count,
        dropoffRate: s.dropoff_rate,
        conversion: s.conversion_rate,
        avgDays: s.average_time_days,
        topPercent: Math.max(0.15, s.patient_count / maxCount),
        bottomPercent: Math.max(0.1, nextCount / maxCount),
        color: COLORS[idx % COLORS.length]
      };
    });
  }, [data]);

  if (!data || data.stages.length === 0) return null;

  const SVG_WIDTH = 900;
  const SVG_HEIGHT = Math.max(450, chartData.length * 80);
  const CENTER_X = 350; // shifted a bit to leave room for labels on right
  const MAX_FUNNEL_WIDTH = 550;
  
  const SLICE_HEIGHT = 65;
  const GAP = 15;
  const TOTAL_SLICE_H = SLICE_HEIGHT + GAP;
  
  // Center vertically
  const startY = (SVG_HEIGHT - (chartData.length * TOTAL_SLICE_H)) / 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", width: "100%" }}>
      
      {/* KPI Header Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          padding: 16,
          background: "var(--color-bg)",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Total Entered</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>{formatNumber(data.total_entered)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, borderLeft: "1px solid var(--color-border)", paddingLeft: 16 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Total Completed</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-success)" }}>{formatNumber(data.total_completed)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, borderLeft: "1px solid var(--color-border)", paddingLeft: 16 }}>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Overall Conversion</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "var(--color-primary)" }}>{formatPercent(data.overall_conversion)}</span>
        </div>
      </div>

      {/* Funnel SVG */}
      <div style={{ width: "100%", overflowX: "auto", display: "flex", justifyContent: "center" }}>
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} style={{ fontFamily: "inherit" }}>
          
          {chartData.map((stage, idx) => {
            const yTop = startY + idx * TOTAL_SLICE_H;
            const yBottom = yTop + SLICE_HEIGHT;
            
            const topW = MAX_FUNNEL_WIDTH * stage.topPercent;
            const bottomW = MAX_FUNNEL_WIDTH * stage.bottomPercent;
            
            const topLeft = CENTER_X - topW / 2;
            const topRight = CENTER_X + topW / 2;
            const bottomLeft = CENTER_X - bottomW / 2;
            const bottomRight = CENTER_X + bottomW / 2;
            
            // Faux 3D Shadow (darker polygon behind/below)
            const shadowOffset = 25;
            const shadowPoints = `
              ${bottomLeft},${yBottom} 
              ${bottomRight},${yBottom} 
              ${bottomRight - shadowOffset},${yBottom + GAP + 5} 
              ${bottomLeft - shadowOffset},${yBottom + GAP + 5}
            `;
            
            // Main slice polygon
            const points = `
              ${topLeft},${yTop} 
              ${topRight},${yTop} 
              ${bottomRight},${yBottom} 
              ${bottomLeft},${yBottom}
            `;
            
            // Label attachment point (middle of the right edge)
            const attachX = CENTER_X + ((topW + bottomW) / 4);
            const attachY = yTop + (SLICE_HEIGHT / 2);
            
            // Label positions
            const lineEndX = CENTER_X + (MAX_FUNNEL_WIDTH / 2) + 60;
            const textX = lineEndX + 15;
            
            return (
              <g key={stage.name}>
                {/* 3D Shadow */}
                {idx < chartData.length - 1 && (
                  <polygon 
                    points={shadowPoints} 
                    fill="#1f2937" 
                    opacity={0.3} 
                  />
                )}
                
                {/* Main Slice */}
                <polygon 
                  points={points} 
                  fill={stage.color} 
                  style={{ transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = "brightness(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "none";
                  }}
                />
                
                {/* Text inside the slice */}
                <text 
                  x={CENTER_X} 
                  y={yTop + SLICE_HEIGHT / 2 + 6} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize={18} 
                  fontWeight={700}
                  style={{ pointerEvents: "none" }}
                >
                  {formatNumber(stage.count)}
                </text>
                
                {/* Connecting Line and Circles */}
                <circle cx={attachX} cy={attachY} r={14} fill="white" opacity={0.3} />
                <circle cx={attachX} cy={attachY} r={10} fill="white" />
                <circle cx={attachX} cy={attachY} r={6} fill={stage.color} />
                <line 
                  x1={attachX + 14} 
                  y1={attachY} 
                  x2={lineEndX} 
                  y2={attachY} 
                  stroke={stage.color} 
                  strokeWidth={2} 
                />
                <circle cx={lineEndX} cy={attachY} r={4} fill={stage.color} fillOpacity={0.2} stroke={stage.color} strokeWidth={2}/>
                
                {/* Stage Name */}
                <text 
                  x={textX} 
                  y={attachY - 2} 
                  fill="var(--color-text-primary)" 
                  fontSize={15} 
                  fontWeight={600}
                >
                  {stage.name}
                </text>
                
                {/* Stage Stats */}
                {idx > 0 && (
                  <text 
                    x={textX} 
                    y={attachY + 16} 
                    fill="var(--color-text-secondary)" 
                    fontSize={13}
                    fontWeight={500}
                  >
                    {formatPercent(stage.conversion)} conv • {formatPercent(stage.dropoffRate)} drop
                  </text>
                )}
                {idx === 0 && (
                  <text 
                    x={textX} 
                    y={attachY + 16} 
                    fill="var(--color-text-secondary)" 
                    fontSize={13}
                    fontWeight={500}
                  >
                    100% (Entry Cohort)
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

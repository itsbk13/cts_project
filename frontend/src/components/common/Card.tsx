"use client";

import React from "react";

// ============================================================
// Card — base surface component
// ============================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Optional title rendered above children */
  title?: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Optional right-side header slot */
  headerRight?: React.ReactNode;
  /** Remove default padding */
  noPadding?: boolean;
  /** Make card clickable */
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  title,
  subtitle,
  headerRight,
  noPadding = false,
  onClick,
}: CardProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      className={`card ${noPadding ? "!p-0" : ""} ${onClick ? "cursor-pointer text-left w-full hover:border-[var(--color-primary)] transition-colors" : ""} ${className}`}
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", gap: "0" }}
    >
      {(title || headerRight) && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: children ? "16px" : "0",
            padding: noPadding ? "var(--card-padding)" : "0",
            paddingBottom: noPadding ? "0" : undefined,
          }}
        >
          <div>
            {title && (
              <h3 className="text-section-title" style={{ margin: 0 }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-meta" style={{ marginTop: 4 }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && <div style={{ flexShrink: 0 }}>{headerRight}</div>}
        </div>
      )}
      {noPadding ? children : <div style={{ flex: 1 }}>{children}</div>}
    </Tag>
  );
}

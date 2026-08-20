"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

// ============================================================
// Drawer — reusable base drawer component
//
// LeakageDrawer and PatientRiskDrawer both use this as their shell.
// This component owns: overlay, slide-in animation, right-side
// positioning, close button, Escape key, responsive width,
// scroll behavior, and accessibility.
// ============================================================

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number | string;
  /** ID for the drawer panel — used for aria-labelledby */
  id?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 480,
  id = "drawer-panel",
}: DrawerProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll while drawer is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="overlay-enter"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(17, 24, 39, 0.35)",
          backdropFilter: "blur(2px)",
          zIndex: 40,
        }}
      />

      {/* Drawer panel */}
      <div
        id={id}
        className="drawer-enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: typeof width === "number" ? `${width}px` : width,
          maxWidth: "95vw",
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-drawer)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              id={`${id}-title`}
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="text-meta"
                style={{ marginTop: 4, marginBottom: 0 }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: "4px", marginTop: 2, flexShrink: 0 }}
            aria-label="Close drawer"
            id={`${id}-close`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px 24px",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitMerge,
  Users,
  Droplets,
  TrendingDown,
  AlertTriangle,
  BarChart2,
} from "lucide-react";

// ============================================================
// TopNavigation — primary page navigation tabs
// ============================================================

const NAV_ITEMS = [
  { label: "Overview",             href: "/",        icon: LayoutDashboard },
  { label: "Journey Funnel",       href: "/funnel",  icon: GitMerge        },
  { label: "Cohort Analysis",      href: "/cohorts", icon: Users           },
  { label: "Leakage Analysis",     href: "/leakage", icon: Droplets        },
  { label: "Survival Analysis",    href: "/survival",icon: TrendingDown    },
  { label: "Journey Risk",         href: "/risk",    icon: AlertTriangle   },
  { label: "SHAP Explainability",  href: "/shap",    icon: BarChart2       },
];

export function TopNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Primary navigation"
      style={{
        height: "var(--nav-height)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "stretch",
        padding: "0 8px",
        gap: 2,
        flexShrink: 0,
        overflowX: "auto",
        // Hide scrollbar on nav
        scrollbarWidth: "none",
      }}
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
              textDecoration: "none",
              borderBottom: active
                ? "2px solid var(--color-primary)"
                : "2px solid transparent",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease, border-color 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-secondary)";
              }
            }}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

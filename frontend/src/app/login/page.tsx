"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// ============================================================
// Login Page — Split-Screen Enterprise Healthcare Analytics Entry
// Route: /login
// ============================================================

export default function LoginPage() {
  const router = useRouter();
  const { session, isInitialized, initialize, login, isLoading } = useAuthStore();

  // 1. Initial fields are empty by default
  const [organization, setOrganization] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize auth state and redirect if already logged in
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && session?.isAuthenticated) {
      router.replace("/");
    }
  }, [isInitialized, session, router]);

  // Demo credential autofill helper
  const handleUseDemoAccount = () => {
    setOrganization("Demo Healthcare Center");
    setUserId("mentor@demo.com");
    setPassword("password123");
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validation
    if (!organization.trim()) {
      setErrorMessage("Hospital / Organization is required.");
      return;
    }
    if (!userId.trim()) {
      setErrorMessage("User ID is required.");
      return;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    try {
      await login(organization, userId, password);
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      // Surface network errors vs. credential errors distinctly
      if (msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
        setErrorMessage("Unable to connect to the authentication service. Please try again.");
      } else {
        setErrorMessage("Unable to sign in. Please check your User ID and password.");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--color-bg)",
      }}
    >
      {/* ── Left Side: Brand & Connected Journey Visual ──────── */}
      <div
        style={{
          flex: "1 1 50%",
          background: "var(--color-navy)",
          color: "white",
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle background ambient overlay */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, rgba(23, 43, 77, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Top Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--color-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 4px 14px rgba(15, 118, 110, 0.35)",
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              PATIENT JOURNEY
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)", letterSpacing: "0.08em" }}>
              INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Center Presentation: Product Story & Refined 5-Node Journey Visual */}
        <div style={{ maxWidth: 480, margin: "32px 0", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(20, 184, 166, 0.15)",
              border: "1px solid rgba(20, 184, 166, 0.30)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-accent)",
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <ShieldCheck size={13} />
            CTS Hackathon Platform
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Turning patient journey data into actionable intelligence.
          </h1>

          {/* 3. Updated product description */}
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255, 255, 255, 0.75)", margin: "0 0 28px" }}>
            Actionable visibility into patient progression, Prior Authorization bottlenecks,
            proactive drop-off risk, and explainable AI interventions.
          </p>

          {/* 4. Refined 5-Node Connected Patient Journey Visual */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 10,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.6)" }}>
              End-to-End Patient Journey Architecture
            </div>

            {/* 5 Connected Semantic Nodes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 6,
                alignItems: "center",
              }}
            >
              {/* Node 1: Diagnosis */}
              <div
                style={{
                  background: "#1E3A5F",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>1</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "white", marginTop: 2 }}>
                  DIAGNOSIS
                </div>
              </div>

              {/* Node 2: Prescription */}
              <div
                style={{
                  background: "#0F766E",
                  border: "1px solid #14B8A6",
                  borderRadius: 6,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700 }}>2</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "white", marginTop: 2 }}>
                  PRESCRIPTION
                </div>
              </div>

              {/* Node 3: Prior Authorization (Amber/Coral Bottleneck) */}
              <div
                style={{
                  background: "rgba(220, 76, 76, 0.25)",
                  border: "1px solid #DC4C4C",
                  borderRadius: 6,
                  padding: "8px 6px",
                  textAlign: "center",
                  boxShadow: "0 0 10px rgba(220, 76, 76, 0.3)",
                }}
              >
                <div style={{ fontSize: 10, color: "#FCA5A5", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <AlertTriangle size={10} color="#F87171" /> 3
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#FECACA", marginTop: 2, lineHeight: 1.1 }}>
                  PRIOR AUTH
                </div>
              </div>

              {/* Node 4: Copay */}
              <div
                style={{
                  background: "#0D9488",
                  border: "1px solid #2DD4BF",
                  borderRadius: 6,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700 }}>4</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "white", marginTop: 2 }}>
                  COPAY
                </div>
              </div>

              {/* Node 5: First Fill (Emerald) */}
              <div
                style={{
                  background: "#16A34A",
                  border: "1px solid #4ADE80",
                  borderRadius: 6,
                  padding: "8px 6px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <CheckCircle2 size={10} color="#BBF7D0" /> 5
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "white", marginTop: 2 }}>
                  FIRST FILL
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.45)", zIndex: 1 }}>
          Patient Journey Intelligence &bull; Healthcare Analytics Command Center
        </div>
      </div>

      {/* ── Right Side: Login Form Card ──────────────────────── */}
      <div
        style={{
          flex: "1 1 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 440,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "36px 32px",
            boxShadow: "0 8px 30px rgba(23, 43, 77, 0.08)",
          }}
        >
          {/* Form Header */}
          <div style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-navy)", margin: "0 0 6px" }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
              Sign in to access your Patient Journey Intelligence workspace.
            </p>
          </div>

          {/* Validation Error Message */}
          {errorMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 6,
                background: "var(--color-danger-bg)",
                border: "1px solid #FECACA",
                color: "var(--color-danger)",
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Field 1: Hospital / Organization */}
            <div>
              <label
                htmlFor="org-input"
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 6,
                }}
              >
                Hospital / Organization
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                    display: "flex",
                  }}
                >
                  <Building2 size={16} />
                </div>
                <input
                  id="org-input"
                  type="text"
                  placeholder="Enter hospital or organization name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    fontSize: 13,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--control-radius)",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Field 2: Email / User ID */}
            <div>
              <label
                htmlFor="user-input"
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 6,
                }}
              >
                User ID
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                    display: "flex",
                  }}
                >
                  <Mail size={16} />
                </div>
                <input
                  id="user-input"
                  type="text"
                  placeholder="Enter user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    fontSize: 13,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--control-radius)",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Field 3: Password */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label
                  htmlFor="password-input"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--color-teal)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                    display: "flex",
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 38px",
                    fontSize: 13,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--control-radius)",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button: LOGIN → */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                marginTop: 6,
                background: "var(--color-teal)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0D665F")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-teal)")}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>LOGIN →</span>
                </>
              )}
            </button>

            {/* 2. Demo Account Quick-Fill Option */}
            <button
              type="button"
              onClick={handleUseDemoAccount}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-teal)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-navy)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-teal)")}
            >
              <Sparkles size={13} />
              <span>Use Demo Account</span>
            </button>
          </form>

          {/* Demo / Register Footer */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--color-text-secondary)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--color-success)",
                  display: "inline-block",
                }}
              />
              {process.env.NEXT_PUBLIC_DEMO_AUTH === "false" ? "Live Environment" : "Demo Environment"}
            </span>
            <Link
              href="/register"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-teal)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
            >
              Register new account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

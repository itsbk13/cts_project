"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Mail,
  Hash,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { verifyResetCode } from "@/services/authApi";

// ============================================================
// Verify Code Page — OTP verification for password reset
// Route: /verify-code?email=<encoded>
// Flow: POST /verify-code → /reset-password?email=...&code=...
// Styled in the CTS Patient Journey Intelligence design system.
// ============================================================

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: if no email in query, redirect back to forgot-password
  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Verification code is required.");
      return;
    }

    setLoading(true);
    try {
      await verifyResetCode(email, code.trim());
      // Navigate to reset-password, pass email + code as query params
      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code.trim())}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("network")) {
        setError("Unable to connect to the service. Please try again.");
      } else {
        setError("Invalid or expired verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "var(--color-navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(23, 43, 77, 0.18)",
            }}
          >
            <Activity size={19} color="white" />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--color-navy)",
                lineHeight: 1.2,
              }}
            >
              PATIENT JOURNEY
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--color-teal)",
                letterSpacing: "0.08em",
              }}
            >
              INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "36px 32px",
            boxShadow: "0 8px 30px rgba(23, 43, 77, 0.08)",
          }}
        >
          {/* Step indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 20,
            }}
          >
            {["Send Code", "Verify", "New Password"].map((step, i) => (
              <React.Fragment key={step}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: i === 1 ? "var(--color-teal)" : "var(--color-text-muted)",
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: i === 1 ? "var(--color-primary-light)" : "transparent",
                  }}
                >
                  {step}
                </div>
                {i < 2 && (
                  <div style={{ width: 16, height: 1, background: "var(--color-border)" }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Header */}
          <div style={{ marginBottom: 22 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--color-navy)",
                margin: "0 0 6px",
              }}
            >
              Enter verification code
            </h2>
            {email && (
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                A verification code was sent to{" "}
                <strong style={{ color: "var(--color-navy)" }}>{email}</strong>.
                Enter it below.
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
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
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                htmlFor="verify-code-input"
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
                Verification Code
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
                  <Hash size={16} />
                </div>
                <input
                  id="verify-code-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter the code from your email"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  autoComplete="one-time-code"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    fontSize: 16,
                    letterSpacing: "0.15em",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--control-radius)",
                    background: "var(--color-surface)",
                    color: "var(--color-navy)",
                    fontWeight: 700,
                    outline: "none",
                    textAlign: "left",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                background: "var(--color-teal)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0D665F")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-teal)")}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Resend / Back */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 13,
              color: "var(--color-text-secondary)",
            }}
          >
            <Link
              href="/forgot-password"
              style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: 12 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-teal)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              ← Resend code
            </Link>
            <Link
              href="/login"
              style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: 12 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-teal)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspense boundary required by Next.js when using useSearchParams in a page component
export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--color-bg)" }} />}>
      <VerifyCodeContent />
    </Suspense>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Mail,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { requestPasswordReset } from "@/services/authApi";

// ============================================================
// Forgot Password Page — Initiate password reset flow
// Route: /forgot-password
// Flow: Enter Email → POST /forgot-password → /verify-code
// Styled in the CTS Patient Journey Intelligence design system.
// ============================================================

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      // Navigate to verify code page, passing email as route state
      router.push(`/verify-code?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("network")) {
        setError("Unable to connect to the service. Please try again.");
      } else {
        setError(msg || "Unable to process your request. Please try again.");
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
          {/* Icon */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--color-primary-light)",
              border: "1px solid rgba(20, 184, 166, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <KeyRound size={22} color="var(--color-teal)" />
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
              Reset your password
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
              Enter the email address associated with your account. We will send
              you a verification code.
            </p>
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
                htmlFor="forgot-email"
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
                Email Address
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
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  autoComplete="email"
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
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: "1px solid var(--color-border)",
              textAlign: "center",
              fontSize: 13,
              color: "var(--color-text-secondary)",
            }}
          >
            Remember your password?{" "}
            <Link
              href="/login"
              style={{ color: "var(--color-teal)", fontWeight: 600, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

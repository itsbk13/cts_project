"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { resetPassword } from "@/services/authApi";

// ============================================================
// Reset Password Page — Set a new password
// Route: /reset-password?email=<encoded>&code=<encoded>
// Flow: POST /reset-password → /login
// Styled in the CTS Patient Journey Intelligence design system.
// ============================================================

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const code = searchParams.get("code") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Guard: if email or code missing, redirect back to forgot-password
  useEffect(() => {
    if (!email || !code) {
      router.replace("/forgot-password");
    }
  }, [email, code, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError("New password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("network")) {
        setError("Unable to connect to the service. Please try again.");
      } else {
        setError(msg || "Unable to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────
  if (success) {
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
          <div
            className="card"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              padding: "40px 32px",
              boxShadow: "0 8px 30px rgba(23, 43, 77, 0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--color-success-bg)",
                border: "2px solid var(--color-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle2 size={26} color="var(--color-success)" />
            </div>

            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--color-navy)",
                margin: "0 0 8px",
              }}
            >
              Password Updated
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                margin: "0 0 28px",
              }}
            >
              Your password has been reset successfully. You can now sign in
              with your new credentials.
            </p>

            <button
              onClick={() => router.push("/login")}
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
              Go to Login <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Reset Form ─────────────────────────────────────────────
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
                    color: i === 2 ? "var(--color-teal)" : "var(--color-text-muted)",
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: i === 2 ? "var(--color-primary-light)" : "transparent",
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
              Create new password
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
              Enter and confirm your new password. It must be at least 6
              characters.
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
            {/* New Password */}
            <div>
              <label
                htmlFor="reset-new-password"
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
                New Password
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
                  <Lock size={16} />
                </div>
                <input
                  id="reset-new-password"
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete="new-password"
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
                  onClick={() => setShowNew(!showNew)}
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
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reset-confirm-password"
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
                Confirm Password
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
                  <Lock size={16} />
                </div>
                <input
                  id="reset-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete="new-password"
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
                  onClick={() => setShowConfirm(!showConfirm)}
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
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
                marginTop: 4,
                background: "var(--color-teal)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0D665F")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-teal)")}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Set New Password</span>
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
            <Link
              href="/login"
              style={{ color: "var(--color-teal)", fontWeight: 600, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspense boundary required by Next.js when using useSearchParams in a page component
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--color-bg)" }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

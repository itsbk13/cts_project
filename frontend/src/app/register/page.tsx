"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { registerUser } from "@/services/authApi";

// ============================================================
// Register Page — New Account Registration
// Route: /register
// Styled in the CTS Patient Journey Intelligence design system.
// API contract from GitHub reference: POST /register
// ============================================================

const ROLES = ["Nurse", "Doctor", "Pharmacist", "Admin", "Analyst", "Manager"];

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    user_name: "",
    hospital_name: "",
    email: "",
    role: "Analyst",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ user_id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError(null);
  };

  const handleCopy = async () => {
    if (!successData) return;
    try {
      await navigator.clipboard.writeText(successData.user_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — silent fail
    }
  };

  const validate = (): string | null => {
    if (!formData.user_name.trim()) return "Full name is required.";
    if (!formData.hospital_name.trim()) return "Hospital / Organization is required.";
    if (!formData.email.trim()) return "Email address is required.";
    if (!formData.email.includes("@")) return "Please enter a valid email address.";
    if (!formData.password) return "Password is required.";
    if (formData.password.length < 6) return "Password must be at least 6 characters.";
    if (formData.password !== formData.confirm_password) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({
        user_name: formData.user_name,
        hospital_name: formData.hospital_name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      });
      setSuccessData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("network")) {
        setError("Unable to connect to the service. Please try again.");
      } else {
        setError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────
  if (successData) {
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
        <div
          style={{
            width: "100%",
            maxWidth: 440,
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
            Account Created
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary)",
              margin: "0 0 24px",
            }}
          >
            Your account has been registered. Use the User ID below to sign in.
          </p>

          {/* User ID display with copy */}
          <div
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-muted)",
                  marginBottom: 4,
                }}
              >
                Your User ID
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--color-navy)",
                  fontFamily: "monospace",
                }}
              >
                {successData.user_id}
              </div>
            </div>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? "var(--color-success-bg)" : "var(--color-primary-light)",
                border: `1px solid ${copied ? "var(--color-success)" : "var(--color-accent)"}`,
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: copied ? "var(--color-success)" : "var(--color-teal)",
                transition: "all 0.15s ease",
              }}
              aria-label="Copy User ID"
            >
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

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
    );
  }

  // ── Registration Form ──────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--color-bg)",
      }}
    >
      {/* ── Left Brand Panel ──────────────────────────────── */}
      <div
        style={{
          flex: "0 0 380px",
          background: "var(--color-navy)",
          color: "white",
          padding: "48px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient teal glow */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, rgba(23, 43, 77, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Brand */}
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

        {/* Center copy */}
        <div style={{ zIndex: 1 }}>
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
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
            }}
          >
            <ShieldCheck size={13} />
            New Account
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
            }}
          >
            Join the Patient Journey Intelligence platform.
          </h1>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.65)",
              margin: 0,
            }}
          >
            Register your hospital account to access journey analytics, leakage
            intelligence, risk monitoring, and AI-powered interventions.
          </p>
        </div>

        <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.40)", zIndex: 1 }}>
          Patient Journey Intelligence • CTS Hackathon
        </div>
      </div>

      {/* ── Right Form Panel ──────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
          overflowY: "auto",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 480,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "36px 32px",
            boxShadow: "0 8px 30px rgba(23, 43, 77, 0.08)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--color-navy)",
                margin: "0 0 6px",
              }}
            >
              Create your account
            </h2>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
              Register to access Patient Journey Intelligence.
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

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Full Name */}
            {fieldWrapper("Full Name", "user_name", formData.user_name, handleChange, <User size={16} />, "text", "Enter your full name")}

            {/* Hospital */}
            {fieldWrapper("Hospital / Organization", "hospital_name", formData.hospital_name, handleChange, <Building2 size={16} />, "text", "Enter hospital or organization name")}

            {/* Email */}
            {fieldWrapper("Email Address", "email", formData.email, handleChange, <Mail size={16} />, "email", "Enter your email address")}

            {/* Role */}
            <div>
              <label
                htmlFor="role"
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
                Role
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
                    pointerEvents: "none",
                  }}
                >
                  <Briefcase size={16} />
                </div>
                <select
                  id="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    fontSize: 13,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--control-radius)",
                    background: "var(--color-surface)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    appearance: "none",
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
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
                Password
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
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm_password"
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
                  id="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={handleChange}
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
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
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
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "var(--color-teal)", fontWeight: 600, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Internal field helper ──────────────────────────────────
function fieldWrapper(
  label: string,
  id: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
  icon: React.ReactNode,
  type: string,
  placeholder: string
) {
  return (
    <div>
      <label
        htmlFor={id}
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
        {label}
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
          {icon}
        </div>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
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
  );
}

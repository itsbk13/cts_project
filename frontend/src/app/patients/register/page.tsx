"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Building2,
  MapPin,
  Activity,
  DollarSign,
  Heart,
  Pill,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ClipboardPen,
} from "lucide-react";
import { registerPatient } from "@/services/patientApi";
import type { PatientRegistration } from "@/types/patient";

// ============================================================
// Register Patient Page
// Route: /patients/register
// ============================================================

const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West"];
const DIAGNOSES = ["Type A", "Type B", "Type C", "Rare Disease"];
const THERAPIES = ["Biologic A", "Biologic B", "Small Molecule", "Infusion Therapy", "Oral Therapy"];
const INSURANCES = ["Commercial", "Medicare", "Medicaid", "Self-Pay", "Other"];

interface FieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

function FormField({ id, label, icon, required, children, hint }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 700,
          color: "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 6,
        }}
      >
        <span style={{ color: "var(--color-text-muted)" }}>{icon}</span>
        {label}
        {required && <span style={{ color: "var(--color-danger)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 13,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--control-radius)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
};

export default function RegisterPatientPage() {
  const router = useRouter();

  const [form, setForm] = useState<PatientRegistration>({
    patient_id: "",
    age: 0,
    region: "",
    diagnosis: "",
    therapy: "",
    insurance: "",
    copay_amount: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ patient_id: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
    setError(null);
  };

  const validate = (): string | null => {
    if (!form.patient_id.trim()) return "Patient ID is required.";
    if (form.age <= 0 || form.age > 120) return "Please enter a valid age (1–120).";
    if (!form.region) return "Please select a Region.";
    if (!form.diagnosis) return "Please select a Diagnosis.";
    if (!form.therapy) return "Please select a Therapy.";
    if (!form.insurance) return "Please select an Insurance type.";
    if (form.copay_amount < 0) return "Copay amount cannot be negative.";
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
      const result = await registerPatient(form);
      setSuccess({ patient_id: result.patient_id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div
          className="card"
          style={{ textAlign: "center", padding: "40px 32px" }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-success-bg)",
              border: "2px solid var(--color-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2 size={28} color="var(--color-success)" />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-navy)", margin: "0 0 8px" }}>
            Patient Registered
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 24px" }}>
            Patient <strong style={{ fontFamily: "monospace" }}>{success.patient_id}</strong> has been
            enrolled in the system.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href={`/journey/event?patient_id=${success.patient_id}`}
              className="btn-primary"
              style={{
                justifyContent: "center",
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                background: "var(--color-teal)",
              }}
            >
              <ClipboardPen size={16} />
              <span>Update Journey Event</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/patients"
              className="btn-secondary"
              style={{ justifyContent: "center", padding: "10px", fontSize: 13, textDecoration: "none" }}
            >
              View Patient List
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setForm({
                  patient_id: "",
                  age: 0,
                  region: "",
                  diagnosis: "",
                  therapy: "",
                  insurance: "",
                  copay_amount: 0,
                });
              }}
              className="btn-ghost"
              style={{ justifyContent: "center", fontSize: 13 }}
            >
              Register Another Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page intro */}
      <div className="card" style={{ padding: "16px 20px", background: "var(--color-primary-light)", border: "1px solid #99F6E4" }}>
        <div style={{ fontSize: 13, color: "var(--color-teal)", fontWeight: 600 }}>
          Enroll a new patient into the Patient Journey Intelligence system. After registration, you can update their journey events and monitor risk in real time.
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-navy)", margin: "0 0 20px" }}>
          Patient Information
        </h2>

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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Row 1: Patient ID + Age */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormField id="patient_id" label="Patient ID" icon={<User size={13} />} required>
              <input
                id="patient_id"
                type="text"
                placeholder="e.g. PT-10009"
                value={form.patient_id}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>
            <FormField id="age" label="Age" icon={<Activity size={13} />} required>
              <input
                id="age"
                type="number"
                min={1}
                max={120}
                placeholder="e.g. 54"
                value={form.age === 0 ? "" : form.age}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>
          </div>

          {/* Row 2: Region + Diagnosis */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormField id="region" label="Region" icon={<MapPin size={13} />} required>
              <select id="region" value={form.region} onChange={handleChange} style={selectStyle}>
                <option value="">[ Select Region ▼ ]</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField id="diagnosis" label="Diagnosis" icon={<Heart size={13} />} required>
              <select id="diagnosis" value={form.diagnosis} onChange={handleChange} style={selectStyle}>
                <option value="">[ Select Diagnosis ▼ ]</option>
                {DIAGNOSES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
          </div>

          {/* Row 3: Therapy + Insurance */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormField id="therapy" label="Therapy" icon={<Pill size={13} />} required>
              <select id="therapy" value={form.therapy} onChange={handleChange} style={selectStyle}>
                <option value="">[ Select Therapy ▼ ]</option>
                {THERAPIES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField id="insurance" label="Insurance" icon={<ShieldCheck size={13} />} required>
              <select id="insurance" value={form.insurance} onChange={handleChange} style={selectStyle}>
                <option value="">[ Select Insurance ▼ ]</option>
                {INSURANCES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </FormField>
          </div>

          {/* Row 4: Copay Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormField
              id="copay_amount"
              label="Copay Amount ($)"
              icon={<DollarSign size={13} />}
              hint="Patient's out-of-pocket copay amount per fill"
            >
              <input
                id="copay_amount"
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 120"
                value={form.copay_amount === 0 ? "" : form.copay_amount}
                onChange={handleChange}
                style={inputStyle}
              />
            </FormField>
          </div>

          {/* Submit */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 6,
              paddingTop: 18,
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                background: "var(--color-teal)",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Save Patient</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
            <Link
              href="/patients"
              className="btn-secondary"
              style={{ padding: "12px 20px", fontSize: 14, textDecoration: "none" }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

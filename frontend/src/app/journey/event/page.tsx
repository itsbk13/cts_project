"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  MapPin,
  Activity,
  DollarSign,
  Heart,
  Pill,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
  Save,
  ArrowRight,
  Calendar,
  Phone,
  Clock,
  Info,
  ArrowLeft,
  Search,
} from "lucide-react";
import { getInstantRiskScore, saveJourneyEvent } from "@/services/journeyApi";
import { getPatient } from "@/services/patientApi";
import { RiskScoreCard } from "@/components/patients/RiskScoreCard";
import type {
  JourneyEventForm,
  JourneyStage,
  InstantRiskResponse,
  RiskCategory,
} from "@/types/patient";

// ============================================================
// Journey Event Entry Page  ⭐⭐⭐
// Route: /journey/event
//
// The critical hospital workflow page. Nurse/staff enters patient
// journey event details, requests INSTANT RISK SCORE from FastAPI,
// views the result, then saves the event.
// ============================================================

const JOURNEY_STAGES: JourneyStage[] = [
  "Diagnosis",
  "Prescription",
  "Prior Authorization",
  "Copay",
  "First Fill",
];

const STAGE_EVENTS: Record<JourneyStage, string[]> = {
  "Diagnosis": ["Diagnosis Confirmed", "Re-diagnosis", "Referral Issued"],
  "Prescription": ["Prescription Written", "Prescription Modified", "Sent to Pharmacy"],
  "Prior Authorization": ["PA Submitted", "PA Approved", "PA Rejected", "PA Under Review"],
  "Copay": ["Copay Assistance Applied", "Copay Paid", "Copay Barrier Identified"],
  "First Fill": ["First Fill Dispensed", "First Fill Delayed", "Patient No-Show"],
};

const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West"];
const DIAGNOSES = ["Type A", "Type B", "Type C", "Rare Disease"];
const THERAPIES = ["Biologic A", "Biologic B", "Small Molecule", "Infusion Therapy", "Oral Therapy"];
const INSURANCES = ["Commercial", "Medicare", "Medicaid", "Self-Pay", "Other"];

type WorkflowStep = "entry" | "risk" | "saved";

const STEPS = [
  { key: "entry", label: "Enter Event" },
  { key: "risk",  label: "View Risk Score" },
  { key: "saved", label: "Event Saved" },
];

function StepIndicator({ current }: { current: WorkflowStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 4 }}>
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: done ? "var(--color-success)" : active ? "var(--color-teal)" : "var(--color-border)",
                  color: done || active ? "white" : "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  transition: "all 0.2s ease",
                }}
              >
                {done ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--color-teal)" : done ? "var(--color-success)" : "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  height: 2,
                  flex: 1,
                  background: idx < currentIdx ? "var(--color-success)" : "var(--color-border)",
                  margin: "0 8px",
                  marginBottom: 20,
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

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
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
          <Info size={10} />{hint}
        </div>
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

export default function JourneyEventEntryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefilledPatientId = searchParams.get("patient_id") ?? "";

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<JourneyEventForm>({
    patient_id: prefilledPatientId,
    current_stage: "Prior Authorization",
    event: "PA Submitted",
    age: 0,
    region: "Northeast",
    diagnosis: "Type A",
    therapy: "Biologic A",
    insurance: "Commercial",
    copay_amount: 0,
    pa_required: false,
    pa_delay_days: 0,
    contact_attempts: 0,
    event_date: today,
    notes: "",
  });

  const [step, setStep] = useState<WorkflowStep>("entry");
  const [patientLookupLoading, setPatientLookupLoading] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [riskResult, setRiskResult] = useState<InstantRiskResponse | null>(null);
  const [savedEventId, setSavedEventId] = useState<string | null>(null);

  // Auto-fetch patient demographic data when patient ID is filled or prefilled
  const fetchPatientDetails = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setPatientLookupLoading(true);
    setFormError(null);
    try {
      const patient = await getPatient(id.trim());
      if (patient) {
        setForm((prev) => ({
          ...prev,
          age: patient.age,
          region: patient.region,
          diagnosis: patient.diagnosis,
          therapy: patient.therapy,
          insurance: patient.insurance,
          copay_amount: patient.copay_amount,
          current_stage: patient.current_stage,
          event: STAGE_EVENTS[patient.current_stage]?.[0] || "",
        }));
      }
    } catch {
      // Quietly ignore or let user know
    } finally {
      setPatientLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (prefilledPatientId) {
      setForm((prev) => ({ ...prev, patient_id: prefilledPatientId }));
      fetchPatientDetails(prefilledPatientId);
    }
  }, [prefilledPatientId, fetchPatientDetails]);

  const handlePatientIdBlur = () => {
    fetchPatientDetails(form.patient_id);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value, type } = e.target;
    let parsed: string | number | boolean = value;
    if (type === "number") parsed = value === "" ? 0 : Number(value);
    if (type === "checkbox") parsed = (e.target as HTMLInputElement).checked;

    setForm((prev) => {
      const updated = { ...prev, [id]: parsed };

      // Cascade event selection when stage changes
      if (id === "current_stage") {
        const selectedStage = parsed as JourneyStage;
        updated.event = STAGE_EVENTS[selectedStage]?.[0] || "";

        // Auto set PA required flag based on stage/event convention
        if (selectedStage === "Prior Authorization") {
          updated.pa_required = true;
        } else {
          updated.pa_required = false;
          updated.pa_delay_days = 0;
        }
      }

      return updated;
    });

    setFormError(null);
    setRiskResult(null); // Reset risk when form changes
    if (step === "risk") setStep("entry");
  };

  const validate = (): string | null => {
    if (!form.patient_id.trim()) return "Patient ID is required.";
    if (!form.current_stage) return "Current Stage is required.";
    if (!form.event) return "Event is required.";
    if (form.age <= 0 || form.age > 120) return "Please enter a valid age (1–120).";
    if (!form.event_date) return "Event date is required.";
    if (form.pa_required && form.pa_delay_days < 0) return "PA Delay Days cannot be negative.";
    return null;
  };

  const handleGetRiskScore = async () => {
    setFormError(null);
    setRiskError(null);
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setRiskLoading(true);
    try {
      const result = await getInstantRiskScore({
        patient_id: form.patient_id,
        current_stage: form.current_stage,
        age: form.age,
        region: form.region,
        diagnosis: form.diagnosis,
        therapy: form.therapy,
        insurance: form.insurance,
        copay_amount: form.copay_amount,
        pa_required: form.pa_required,
        pa_delay_days: form.pa_delay_days,
        contact_attempts: form.contact_attempts,
      });
      setRiskResult(result);
      setStep("risk");
    } catch (err) {
      setRiskError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve risk prediction. Please try again."
      );
    } finally {
      setRiskLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    setSaveError(null);
    setSaveLoading(true);
    try {
      const result = await saveJourneyEvent(
        form.patient_id,
        form,
        riskResult?.risk_score,
        riskResult?.risk_level
      );
      setSavedEventId(result.event_id);
      setStep("saved");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Unable to save event. Please try again."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  if (step === "saved" && savedEventId) {
    return (
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        <div className="card" style={{ textAlign: "center", padding: "40px 32px" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--color-success-bg)",
              border: "2px solid var(--color-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2 size={30} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-navy)", margin: "0 0 8px" }}>
            Journey Event Recorded
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>
            Patient <strong style={{ fontFamily: "monospace" }}>{form.patient_id}</strong> — Stage:{" "}
            <strong>{form.current_stage}</strong> (Event: {form.event})
          </p>
          {riskResult && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 8,
                background:
                  riskResult.risk_level === "HIGH"
                    ? "var(--color-risk-high-bg)"
                    : riskResult.risk_level === "MEDIUM"
                    ? "var(--color-risk-medium-bg)"
                    : "var(--color-risk-low-bg)",
                color:
                  riskResult.risk_level === "HIGH"
                    ? "var(--color-risk-high)"
                    : riskResult.risk_level === "MEDIUM"
                    ? "var(--color-risk-medium)"
                    : "var(--color-risk-low)",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              Risk Saved: {Math.round(riskResult.risk_score * 100)}% — {riskResult.risk_level}
            </div>
          )}
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: "0 0 24px" }}>
            Event ID: <span style={{ fontFamily: "monospace" }}>{savedEventId}</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href={`/patients/${form.patient_id}`}
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
              View Patient Timeline <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => {
                setStep("entry");
                setRiskResult(null);
                setSavedEventId(null);
                setForm((prev) => ({
                  ...prev,
                  patient_id: "",
                  notes: "",
                  pa_required: false,
                  pa_delay_days: 0,
                  contact_attempts: 0,
                }));
              }}
              className="btn-secondary"
              style={{ justifyContent: "center", fontSize: 13 }}
            >
              Record Another Event
            </button>
            <Link
              href="/patients"
              className="btn-ghost"
              style={{ justifyContent: "center", fontSize: 13, textDecoration: "none" }}
            >
              Back to Patient List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentEvents = STAGE_EVENTS[form.current_stage] || [];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Step indicator */}
      <div className="card" style={{ padding: "16px 24px" }}>
        <StepIndicator current={step} />
      </div>

      {/* Workflow info banner */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 8,
          background: "var(--color-primary-light)",
          border: "1px solid #99F6E4",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          fontSize: 13,
          color: "var(--color-teal)",
        }}
      >
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Operational Flow:</strong> Enter Patient ID to auto-load clinical profile → Choose Current Stage and Event → Enter details → Click <strong>GET INSTANT RISK SCORE</strong> → Review ML contributing factors → Click <strong>SAVE JOURNEY EVENT</strong>.
        </div>
      </div>

      {/* ── Form Card ────────────────────────────────────────── */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {formError && (
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
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* ── SECTION A: PATIENT IDENTIFICATION ───────────────── */}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-navy)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 14,
                paddingBottom: 6,
                borderBottom: "2px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Patient Profile &amp; Demographics</span>
              {patientLookupLoading && (
                <span style={{ fontSize: 11, color: "var(--color-teal)", display: "flex", alignItems: "center", gap: 4, textTransform: "none" }}>
                  <Loader2 size={12} className="animate-spin" /> Fetching patient...
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField id="patient_id" label="Patient ID" icon={<User size={13} />} required>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="patient_id"
                    type="text"
                    placeholder="e.g. PT-10001 (Press Tab to lookup)"
                    value={form.patient_id}
                    onChange={handleChange}
                    onBlur={handlePatientIdBlur}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={handlePatientIdBlur}
                    className="btn-secondary"
                    style={{ padding: "0 12px", gap: 4 }}
                  >
                    <Search size={14} />
                    <span>Lookup</span>
                  </button>
                </div>
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

              <FormField id="region" label="Region" icon={<MapPin size={13} />} required>
                <select id="region" value={form.region} onChange={handleChange} style={selectStyle}>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </FormField>

              <FormField id="diagnosis" label="Diagnosis" icon={<Heart size={13} />} required>
                <select id="diagnosis" value={form.diagnosis} onChange={handleChange} style={selectStyle}>
                  {DIAGNOSES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>

              <FormField id="therapy" label="Therapy" icon={<Pill size={13} />} required>
                <select id="therapy" value={form.therapy} onChange={handleChange} style={selectStyle}>
                  {THERAPIES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>

              <FormField id="insurance" label="Insurance" icon={<ShieldCheck size={13} />} required>
                <select id="insurance" value={form.insurance} onChange={handleChange} style={selectStyle}>
                  {INSURANCES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </FormField>

              <FormField id="copay_amount" label="Copay Amount ($)" icon={<DollarSign size={13} />}>
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
          </div>

          {/* ── SECTION B: JOURNEY EVENT DETAILS ───────────────── */}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-navy)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 14,
                paddingBottom: 6,
                borderBottom: "2px solid var(--color-border)",
              }}
            >
              Journey Event Details
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField id="current_stage" label="Current Stage" icon={<Activity size={13} />} required>
                <select id="current_stage" value={form.current_stage} onChange={handleChange} style={selectStyle}>
                  {JOURNEY_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>

              <FormField id="event" label="Event Type" icon={<Activity size={13} />} required>
                <select id="event" value={form.event} onChange={handleChange} style={selectStyle}>
                  {currentEvents.map((evt) => (
                    <option key={evt} value={evt}>{evt}</option>
                  ))}
                </select>
              </FormField>

              <FormField id="event_date" label="Event Date" icon={<Calendar size={13} />} required>
                <input
                  id="event_date"
                  type="date"
                  value={form.event_date}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>

              <FormField id="contact_attempts" label="Contact Attempts" icon={<Phone size={13} />}>
                <input
                  id="contact_attempts"
                  type="number"
                  min={0}
                  max={50}
                  placeholder="e.g. 3"
                  value={form.contact_attempts === 0 ? "" : form.contact_attempts}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </FormField>

              {/* Dynamic PA fields: only relevant/rendered when stage is Prior Authorization */}
              {form.current_stage === "Prior Authorization" && (
                <>
                  <FormField id="pa_required" label="PA Required" icon={<ShieldCheck size={13} />}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
                        <input
                          id="pa_required"
                          type="checkbox"
                          checked={form.pa_required}
                          onChange={handleChange}
                          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--color-teal)" }}
                        />
                        <span style={{ fontWeight: form.pa_required ? 700 : 400, color: form.pa_required ? "var(--color-navy)" : "var(--color-text-secondary)" }}>
                          {form.pa_required ? "Yes — PA Submitted/Required" : "No — PA not needed"}
                        </span>
                      </label>
                    </div>
                  </FormField>

                  <FormField
                    id="pa_delay_days"
                    label="PA Delay Days"
                    icon={<Clock size={13} />}
                    hint={form.pa_required ? "Days since PA submission" : "Enable PA Required checkbox to enter delay"}
                  >
                    <input
                      id="pa_delay_days"
                      type="number"
                      min={0}
                      max={365}
                      placeholder="e.g. 14"
                      value={form.pa_delay_days === 0 ? "" : form.pa_delay_days}
                      onChange={handleChange}
                      disabled={!form.pa_required}
                      style={{
                        ...inputStyle,
                        opacity: form.pa_required ? 1 : 0.5,
                        cursor: form.pa_required ? "text" : "not-allowed",
                      }}
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>

          {/* Clinical Notes */}
          <FormField id="notes" label="Event Notes &amp; Observations (Optional)" icon={<Info size={13} />}>
            <textarea
              id="notes"
              placeholder="Enter context like copay cards used, prior rejection letters parsed, etc."
              value={form.notes}
              onChange={handleChange}
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </FormField>
        </div>
      </div>

      {/* ── Risk Score Action ──────────────────────────────────── */}
      {riskError && (
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
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{riskError}</span>
        </div>
      )}

      <button
        id="get-risk-score-btn"
        type="button"
        onClick={handleGetRiskScore}
        disabled={riskLoading || saveLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px",
          borderRadius: 8,
          background: riskLoading ? "var(--color-text-muted)" : "var(--color-navy)",
          color: "white",
          border: "none",
          fontSize: 15,
          fontWeight: 700,
          cursor: riskLoading ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          letterSpacing: "0.02em",
          boxShadow: riskLoading ? "none" : "0 4px 14px rgba(23, 43, 77, 0.25)",
        }}
        onMouseEnter={(e) => {
          if (!riskLoading) e.currentTarget.style.background = "var(--color-teal)";
        }}
        onMouseLeave={(e) => {
          if (!riskLoading) e.currentTarget.style.background = "var(--color-navy)";
        }}
      >
        {riskLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Calculating ML Risk Prediction…</span>
          </>
        ) : (
          <>
            <Zap size={18} />
            <span>GET INSTANT RISK SCORE</span>
          </>
        )}
      </button>

      {/* ── Risk Score Result & Event Saving ────────────────────── */}
      {riskResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircle2 size={15} color="var(--color-success)" />
            Instant risk score predicted successfully. Review contributions prior to saving.
          </div>

          <RiskScoreCard response={riskResult} />

          {saveError && (
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
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{saveError}</span>
            </div>
          )}

          <button
            id="save-journey-event-btn"
            type="button"
            onClick={handleSaveEvent}
            disabled={saveLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "14px",
              borderRadius: 8,
              background: saveLoading ? "var(--color-text-muted)" : "var(--color-success)",
              color: "white",
              border: "none",
              fontSize: 15,
              fontWeight: 700,
              cursor: saveLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: saveLoading ? "none" : "0 4px 14px rgba(22, 163, 74, 0.25)",
            }}
            onMouseEnter={(e) => {
              if (!saveLoading) e.currentTarget.style.background = "#15803D";
            }}
            onMouseLeave={(e) => {
              if (!saveLoading) e.currentTarget.style.background = "var(--color-success)";
            }}
          >
            {saveLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Saving Event…</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>SAVE JOURNEY EVENT</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Back link */}
      <div style={{ paddingBottom: 24 }}>
        <Link
          href="/patients"
          style={{ fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
        >
          <ArrowLeft size={13} /> Back to Patient List
        </Link>
      </div>
    </div>
  );
}

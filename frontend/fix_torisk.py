import sys

with open('src/services/analyticsApi.ts', 'r') as f:
    content = f.read()

old_torisk = '''function toRiskPatient(p: PatientListItem): RiskPatient {
  return {
    patient_id: String(p.patient_id),
    current_stage: (p.current_stage ?? "Diagnosis") as RiskPatient["current_stage"],
    days_in_current_stage: 0,
    risk_score: typeof p.risk_score === "number" ? p.risk_score : 0,
    risk_category: (p.risk_level === "HIGH" ? "HIGH" : "LOW") as RiskPatient["risk_category"],
    top_risk_driver: "Prior Authorization",
    region: p.region ?? "",
    insurance_type: p.insurance ?? "",
  };
}'''

new_torisk = '''function toRiskPatient(p: any): RiskPatient {
  return {
    patient_id: String(p.patient_id),
    current_stage: (p.current_stage ?? "Diagnosis") as RiskPatient["current_stage"],
    days_in_current_stage: typeof p.days_in_current_stage === "number" ? p.days_in_current_stage : 0,
    risk_score: typeof p.risk_score === "number" ? p.risk_score : 0,
    risk_category: (p.risk_level === "HIGH" ? "HIGH" : "LOW") as RiskPatient["risk_category"],
    top_risk_driver: "Prior Authorization",
    region: p.region ?? "",
    insurance_type: p.insurance ?? "",
  };
}'''

content = content.replace(old_torisk, new_torisk)

with open('src/services/analyticsApi.ts', 'w') as f:
    f.write(content)

print("Updated toRiskPatient")

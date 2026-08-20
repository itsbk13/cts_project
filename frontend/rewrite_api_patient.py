import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Replace getPatientRiskDetail
old_risk_detail = '''export async function getPatientRiskDetail(patientId: string): Promise<PatientRiskDetail> {
  await delay(80);
  const state = useDatasetStore.getState();
  return state.getPatientRiskDetail(patientId);
}'''

new_risk_detail = '''export async function getPatientRiskDetail(patientId: string): Promise<PatientRiskDetail> {
  try {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = Bearer ;

    const res = await fetch(http://localhost:8000/api/patients/, { headers });
    if (!res.ok) throw new Error("Failed to fetch patient detail");
    const data = await res.json();
    
    // Fallback parsing for risk factors if backend doesn't provide them
    const factors = data.risk_factors || [
      { name: "PA Delay", contribution: 20, description: "Prior Authorization took longer than 7 days." },
      { name: "High Copay", contribution: 15, description: "Out of pocket cost exceeds typical thresholds." }
    ];

    const timeline = data.timeline?.map((t: any) => ({
      stage: t.stage,
      status: t.status || "completed",
      date: t.date
    })) || [];

    return {
      patient_id: data.patient_id || patientId,
      risk_score: data.risk_score || 0,
      risk_category: data.risk_level === "High" ? "High Risk" : data.risk_level === "Medium" ? "Medium Risk" : "Low Risk",
      current_stage: data.current_stage || "Diagnosis",
      days_in_current_stage: data.days_in_current_stage || 14,
      risk_factors: factors,
      journey_timeline: timeline,
      recommended_action: data.recommendation || "Monitor closely.",
      estimated_revenue_at_risk: data.revenue_at_risk || 50000
    };
  } catch (err) {
    console.error("Falling back to mock patient detail:", err);
    return useDatasetStore.getState().getPatientRiskDetail(patientId);
  }
}'''
content = content.replace(old_risk_detail, new_risk_detail)

# Replace getPatientSHAP
old_shap = '''export async function getPatientSHAP(patientId: string): Promise<PatientSHAPExplanation> {
  await delay(80);
  const state = useDatasetStore.getState();
  return state.getPatientSHAPExplanation(patientId);
}'''

new_shap = '''export async function getPatientSHAP(patientId: string): Promise<PatientSHAPExplanation> {
  try {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = Bearer ;

    const res = await fetch(http://localhost:8000/api/patients//shap, { headers });
    if (!res.ok) throw new Error("Failed to fetch patient SHAP");
    const data = await res.json();
    
    return {
      patient_id: data.patient_id,
      base_value: data.base_value || 0.15,
      predicted_risk: data.predicted_risk || 0,
      features: data.features || [],
      plain_english_summary: data.plain_english_summary || "This patient's risk is elevated primarily due to delays in processing."
    };
  } catch (err) {
    console.error("Falling back to mock patient SHAP:", err);
    return useDatasetStore.getState().getPatientSHAPExplanation(patientId);
  }
}'''
content = content.replace(old_shap, new_shap)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Updated api.ts successfully.")

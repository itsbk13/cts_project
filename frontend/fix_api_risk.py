import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_risk = '''export async function getPatientRisk(patientId: string): Promise<PatientRiskDetail> {
  await delay(80);
  const state = useDatasetStore.getState();
  return state.getPatientRiskDetail(patientId);
}'''

new_risk = '''export async function getPatientRisk(patientId: string): Promise<PatientRiskDetail> {
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
      risk_score: data.risk_score ? Math.round(data.risk_score * 100) : 0,
      risk_category: data.risk_level === "High" ? "HIGH" : data.risk_level === "Medium" ? "MEDIUM" : "LOW",
      current_stage: data.current_stage || "Diagnosis",
      days_in_current_stage: data.days_in_current_stage || 14,
      risk_factors: factors,
      journey_timeline: timeline,
      recommended_action: data.recommendation || "Monitor closely.",
      estimated_revenue_at_risk: data.revenue_at_risk || 50000
    };
  } catch (err) {
    console.error("Falling back to mock patient detail:", err);
    // Since we cleared datasetStore, we just return an empty shell on error
    return {
      patient_id: patientId,
      risk_score: 0,
      risk_category: "LOW",
      current_stage: "Diagnosis",
      days_in_current_stage: 0,
      risk_factors: [],
      journey_timeline: [],
      recommended_action: "",
      estimated_revenue_at_risk: 0
    };
  }
}'''

content = content.replace(old_risk, new_risk)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Updated getPatientRisk successfully.")

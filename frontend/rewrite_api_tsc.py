import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Fix Cohorts
old_cohorts = '''    if (backendData.cohorts && backendData.cohorts.heatmap.length > 0) {
      heatmap = backendData.cohorts.heatmap;
      comparisons = backendData.cohorts.comparisons;
    }'''

new_cohorts = '''    if (backendData.cohorts && backendData.cohorts.heatmap.length > 0) {
      heatmap = backendData.cohorts.heatmap;
      comparisons = backendData.cohorts.comparisons.map((c: any) => ({
        ...c,
        dropoff_rate: 100 - c.first_fill_rate,
        avg_days_to_fill: c.avg_time_to_fill
      }));
    }'''
content = content.replace(old_cohorts, new_cohorts)

# Fix Leakage
old_leakage = '''      return {
        drivers: backendData.leakage.drivers as any,
        stageLeakage: backendData.leakage.stageLeakage,
        regionalLeakage: regional
      };'''

new_leakage = '''      return {
        drivers: backendData.leakage.drivers as any,
        stageLeakage: backendData.leakage.stageLeakage.map((s: any) => ({
          ...s,
          top_driver: s.stage === "Prior Authorization" ? "PA Delays > 7 Days" : 
                      s.stage === "Copay" ? "High Out-of-Pocket" : "Loss to Follow-up"
        })),
        regionalLeakage: regional
      };'''
content = content.replace(old_leakage, new_leakage)

# Fix FunnelStage
old_funnel = '''  let funnel: FunnelStage[] = [
    { stage: "Diagnosis", patient_count: 5000, conversion_rate: 100, dropoff_rate: 0, dropoff_count: 0, average_time_days: 0 },
    { stage: "Prescription", patient_count: 4800, conversion_rate: 96, dropoff_rate: 4, dropoff_count: 200, average_time_days: 2 },
    { stage: "Prior Authorization", patient_count: 4200, conversion_rate: 87.5, dropoff_rate: 12.5, dropoff_count: 600, average_time_days: 14 },
    { stage: "Copay", patient_count: 3100, conversion_rate: 73.8, dropoff_rate: 26.2, dropoff_count: 1100, average_time_days: 5 },
    { stage: "First Fill", patient_count: 2600, conversion_rate: 83.9, dropoff_rate: 16.1, dropoff_count: 500, average_time_days: 3 },
  ];

  try {
    const backendData = await getBackendAnalytics();
    if (backendData.funnel && backendData.funnel.funnel_stages.length > 0) {
      funnel = backendData.funnel.funnel_stages.map((stage, idx) => {
        return {
          stage: stage,
          patient_count: backendData.funnel.patient_counts[idx],
          conversion_rate: backendData.funnel.conversion_rates[idx],
          dropoff_rate: backendData.funnel.dropoff_rates[idx],
          dropoff_count: idx === 0 ? 0 : backendData.funnel.patient_counts[idx - 1] - backendData.funnel.patient_counts[idx],
          average_time_days: backendData.funnel.avg_days_in_stage[idx],
        };
      });
    }
  } catch (err) {
    console.warn("Backend funnel fetch failed, falling back to mock");
  }'''

new_funnel = '''  let funnel: FunnelStage[] = [
    { stage: "Diagnosis", patient_count: 5000, conversion_rate: 100, dropoff_rate: 0, dropoff_count: 0, average_time_days: 0 },
    { stage: "Prescription", patient_count: 4800, conversion_rate: 96, dropoff_rate: 4, dropoff_count: 200, average_time_days: 2 },
    { stage: "Prior Authorization", patient_count: 4200, conversion_rate: 87.5, dropoff_rate: 12.5, dropoff_count: 600, average_time_days: 14 },
    { stage: "Copay", patient_count: 3100, conversion_rate: 73.8, dropoff_rate: 26.2, dropoff_count: 1100, average_time_days: 5 },
    { stage: "First Fill", patient_count: 2600, conversion_rate: 83.9, dropoff_rate: 16.1, dropoff_count: 500, average_time_days: 3 },
  ];

  try {
    const backendData = await getBackendAnalytics();
    if (backendData.funnel && backendData.funnel.funnel_stages.length > 0) {
      funnel = backendData.funnel.funnel_stages.map((stage, idx) => {
        return {
          stage: stage as any,
          patient_count: backendData.funnel.patient_counts[idx],
          conversion_rate: backendData.funnel.conversion_rates[idx],
          dropoff_rate: backendData.funnel.dropoff_rates[idx],
          dropoff_count: idx === 0 ? 0 : backendData.funnel.patient_counts[idx - 1] - backendData.funnel.patient_counts[idx],
          average_time_days: backendData.funnel.avg_days_in_stage[idx],
        };
      });
    }
  } catch (err) {
    console.warn("Backend funnel fetch failed, falling back to mock");
  }'''

content = content.replace(old_funnel, new_funnel)


with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Updated api.ts successfully.")

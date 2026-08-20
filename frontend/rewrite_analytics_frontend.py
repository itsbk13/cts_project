import re

with open('src/services/analyticsApi.ts', 'r') as f:
    content = f.read()

new_interface = '''export interface BackendAnalytics {
  overview: {
    total_patients: number;
    active_journeys: number;
    conversion_rate: number;
    avg_time_to_fill: number;
    revenue_at_risk: number;
  };
  funnel: {
    funnel_stages: string[];
    patient_counts: number[];
    conversion_rates: number[];
    dropoff_rates: number[];
    avg_days_in_stage: number[];
  };
  stage_leakage: Array<{
    stage: string;
    dropoff_count: number;
    dropoff_rate: number;
    revenue_at_risk: number;
  }>;
  cohorts?: {
    heatmap: Array<{ cohort: string; region: string; size: number; month1: number; month2: number; month3: number }>;
    comparisons: Array<{ label: string; values: number[] }>;
  };
  leakage?: {
    drivers: Array<{ rank: number; factor: string; description: string; impact: string; affected_patients: number }>;
    stageLeakage: Array<{ stage: string; dropoff_count: number; dropoff_rate: number; revenue_at_risk: number }>;
    regionalLeakage: Array<{ region: string; dropoff_rate: number; patient_count: number; revenue_at_risk: number }>;
  };
  survival?: {
    time: number[];
    groups: string[];
    data: Record<string, number[]>;
  };
}'''

# Replace the interface
content = re.sub(r'export interface BackendAnalytics \{.*?\n\}', new_interface, content, flags=re.DOTALL)

with open('src/services/analyticsApi.ts', 'w') as f:
    f.write(content)

print("Updated analyticsApi.ts successfully.")

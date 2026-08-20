import re

with open('src/services/analyticsApi.ts', 'r') as f:
    content = f.read()

old_survival_type = '''  survival?: {
    time: number[];
    groups: string[];
    data: Record<string, number[]>;
  };'''

new_survival_type = '''  survival?: {
    curves: Array<{ time: number; survival_probability: number; group: string }>;
    median_survival_days: number;
    key_timepoints: Array<{ days: number; probability: number; label: string }>;
    groups: string[];
  };'''

content = content.replace(old_survival_type, new_survival_type)

old_cohort_type = '''  cohorts?: {
    heatmap: Array<{ cohort: string; region: string; size: number; month1: number; month2: number; month3: number }>;
    comparisons: Array<{ label: string; values: number[] }>;
  };'''

new_cohort_type = '''  cohorts?: {
    heatmap: Array<{ region: string; month: string; dropoff_rate: number; patient_count: number }>;
    comparisons: Array<{ label: string; patient_count: number; first_fill_rate: number; avg_time_to_fill: number }>;
  };'''

content = content.replace(old_cohort_type, new_cohort_type)

with open('src/services/analyticsApi.ts', 'w') as f:
    f.write(content)

print("Updated analyticsApi.ts successfully.")

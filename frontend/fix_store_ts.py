import sys

with open('src/store/datasetStore.ts', 'r') as f:
    content = f.read()

content = content.replace('"Low Risk"', '"LOW"')

old_drawer = '''  getLeakageDrawerData: (stage: string) => ({
    stage,
    dropoff_count: 0,
    dropoff_rate: 0,
    revenue_impact: 0,
    historical_benchmark: 0,
    top_reasons: [],
    recommended_actions: [],
    affected_patients: []
  }),'''

new_drawer = '''  getLeakageDrawerData: (stage: string) => ({
    stage,
    patients_affected: 0,
    dropoff_rate: 0,
    avg_stage_duration_days: 0,
    top_regions: [],
    top_cohorts: [],
    top_drivers: [],
    revenue_at_risk: 0,
    recommended_action: ""
  }),'''

content = content.replace(old_drawer, new_drawer)

with open('src/store/datasetStore.ts', 'w') as f:
    f.write(content)

print("Fixed datasetStore.ts TS errors.")

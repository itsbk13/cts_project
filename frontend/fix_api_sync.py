import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Add store update to getOverview
old_overview_fetch = '''    const analytics = await getBackendAnalytics();
    const total = analytics.overview.total_patients;'''

new_overview_fetch = '''    const analytics = await getBackendAnalytics();
    const total = analytics.overview.total_patients;
    useDatasetStore.setState((state) => ({
      metadata: { ...state.metadata, patient_count: total }
    }));'''

content = content.replace(old_overview_fetch, new_overview_fetch)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Added Zustand patient_count sync to getOverview.")

import sys

with open('src/app/shap/page.tsx', 'r') as f:
    content = f.read()

old_waterfall = '''      {loading || !patientData ? (
        <ChartSkeleton height={380} />
      ) : (
        <Card
          title={Individual Feature Contributions: }
          subtitle="Feature attribution showing how clinical, operational, and payer features pushed risk relative to baseline"
        >
          <PatientSHAPWaterfall explanation={patientData} />
        </Card>
      )}'''

new_waterfall = '''      {loading ? (
        <ChartSkeleton height={380} />
      ) : !patientData ? (
        <Card title="Individual Feature Contributions" subtitle="No patient selected">
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
            Enter a Patient ID above and click Search to view their specific SHAP risk attributions.
          </div>
        </Card>
      ) : (
        <Card
          title={Individual Feature Contributions: }
          subtitle="Feature attribution showing how clinical, operational, and payer features pushed risk relative to baseline"
        >
          <PatientSHAPWaterfall explanation={patientData} />
        </Card>
      )}'''

content = content.replace(old_waterfall, new_waterfall)

# Fix the title in Global model
content = content.replace('analyzed 5,000-patient population', 'analyzed patient population')

with open('src/app/shap/page.tsx', 'w') as f:
    f.write(content)

print("Fixed SHAP page skeleton and 5000 ref.")

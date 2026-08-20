import sys
import re

with open('src/app/shap/page.tsx', 'r') as f:
    content = f.read()

# Fix the skeleton issue
content = re.sub(
    r'\{\s*loading\s*\|\|\s*!patientData\s*\?\s*\(\s*<ChartSkeleton height=\{380\}\s*/>\s*\)\s*:\s*\(\s*<Card.*?<PatientSHAPWaterfall explanation=\{patientData\}\s*/>\s*</Card>\s*\)\}',
    '''{loading ? (
        <ChartSkeleton height={380} />
      ) : !patientData ? (
        <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
          Enter a Patient ID above and click Explain to view their specific SHAP risk attributions.
        </div>
      ) : (
        <Card
          title={Individual Feature Contributions: }
          subtitle="Feature attribution showing how clinical, operational, and payer features pushed risk relative to baseline"
        >
          <PatientSHAPWaterfall explanation={patientData} />
        </Card>
      )}''',
    content,
    flags=re.DOTALL
)

# Remove Global View section
content = re.sub(
    r'\{\s*/\*\s*"?"? GLOBAL VIEW.*?</Card>\s*\)\}',
    '',
    content,
    flags=re.DOTALL
)

with open('src/app/shap/page.tsx', 'w') as f:
    f.write(content)

print("Updated SHAP page.")

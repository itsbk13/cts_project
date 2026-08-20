import sys

with open('src/types/risk.ts', 'r') as f:
    content = f.read()

if 'last_updated?: string;' not in content:
    content = content.replace('patient_id: string;', 'patient_id: string;\n  last_updated?: string;')
    with open('src/types/risk.ts', 'w') as f:
        f.write(content)

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace('patient_id: data.patient_id || patientId,', 'patient_id: data.patient_id || patientId,\n      last_updated: data.last_updated,')

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Added last_updated to PatientRiskDetail")

import sys

with open('src/lib/constants.ts', 'r') as f:
    content = f.read()

content = content.replace('patient_count: 5000,', 'patient_count: 0,')
content = content.replace('filename: "CTS_Patient_Journey_5000.xlsx",', 'filename: "Databricks - Live DB",')

with open('src/lib/constants.ts', 'w') as f:
    f.write(content)

print("Updated constants.ts")

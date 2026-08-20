import sys

with open('src/store/datasetStore.ts', 'r') as f:
    content = f.read()

# Replace initial metadata
content = content.replace('"CTS_Patient_Journey_5000.xlsx"', '"Databricks_Live_Schema"')
content = content.replace('patient_count: 5000,', 'patient_count: "Live",')
content = content.replace('column_count: 18,', 'column_count: "Live",')
content = content.replace('"Active (Demo)"', '"Active (Live DB)"')

# Remove mock data imports
lines = content.split('\n')
new_lines = []
skip = False
for line in lines:
    if 'import {' in line and 'mock' in line:
        pass # Will strip it manually
new_lines = [l for l in lines if not l.startswith('import { mock')]
content = '\n'.join(new_lines)

with open('src/store/datasetStore.ts', 'w') as f:
    f.write(content)

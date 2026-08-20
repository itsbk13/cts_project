import sys
import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# I will just write a regex to replace the fetch calls correctly.
content = re.sub(r'fetch\(``http://localhost:8000/api/patients/\$\{patientId\}`\$\{patientId\}/shap`,', r'fetch(`http://localhost:8000/api/patients/${patientId}/shap`,', content)
content = re.sub(r'fetch\(`http://localhost:8000/api/patients/\$\{patientId\}`', r'fetch(`http://localhost:8000/api/patients/${patientId}`', content)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Fixed fetch paths.")

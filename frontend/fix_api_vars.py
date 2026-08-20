import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace("Bearer ;", "`Bearer ${token}`;")
content = content.replace("http://localhost:8000/api/patients//shap", "`http://localhost:8000/api/patients/${patientId}/shap`")
content = content.replace("http://localhost:8000/api/patients/", "`http://localhost:8000/api/patients/${patientId}`")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Fixed variables.")

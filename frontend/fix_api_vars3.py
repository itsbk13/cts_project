import sys
import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace('headers["Authorization"] = `Bearer `;', 'headers["Authorization"] = `Bearer ${token}`;')
content = content.replace('fetch(`http://localhost:8000/api/patients/`,', 'fetch(`http://localhost:8000/api/patients/${patientId}`,')

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Fixed variables.")

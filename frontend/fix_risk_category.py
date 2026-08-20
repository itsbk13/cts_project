import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace('data.risk_level === "High" ? "HIGH" : data.risk_level === "Medium" ? "MEDIUM" : "LOW"', 'data.risk_level?.toUpperCase() === "HIGH" ? "HIGH" : data.risk_level?.toUpperCase() === "MEDIUM" ? "MEDIUM" : "LOW"')

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Fixed risk_category parsing")

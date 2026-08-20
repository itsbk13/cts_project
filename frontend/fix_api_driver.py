import os

with open("src/services/analyticsApi.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'top_risk_driver: "Prior Authorization",',
    'top_risk_driver: p.top_risk_driver || "Baseline Risk",'
)

with open("src/services/analyticsApi.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated analyticsApi.ts")

import re

with open(r"x:\login\frontend\src\app\leakage\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"const topDriver = data\?\.drivers\[0\] \|\| \{.*?\};\s+const primaryStage = data\?\.stageLeakage\[1\] \|\| \{.*?\};"
replacement = """
  // Dynamically calculate from real databricks data
  const safeDrivers = data?.drivers || [];
  const topDriver = safeDrivers.length > 0 
    ? [...safeDrivers].sort((a, b) => (b.hazard_ratio || 0) - (a.hazard_ratio || 0))[0]
    : { driver: "N/A", stage: "N/A", affected_patients: 0, impact: "LOW", confidence: 0, hazard_ratio: 0 };

  const safeStages = data?.stageLeakage || [];
  const primaryStage = safeStages.length > 0
    ? [...safeStages].sort((a, b) => b.dropoff_count - a.dropoff_count)[0]
    : { stage: "N/A", dropoff_rate: 0, dropoff_count: 0, revenue_at_risk: 0 };
"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\app\leakage\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

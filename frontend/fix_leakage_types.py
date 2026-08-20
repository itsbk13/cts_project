import re

with open(r"x:\login\frontend\src\app\leakage\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'impact: "LOW", confidence: 0, hazard_ratio: 0 };',
    'impact: "LOW" as any, confidence: 0, hazard_ratio: 0, p_value: undefined as number | undefined };'
)

with open(r"x:\login\frontend\src\app\leakage\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

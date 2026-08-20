import re

with open(r"x:\login\frontend\src\app\leakage\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace hardcoded p-value in top summary strip
content = content.replace(
    'Hazard Ratio: {topDriver.hazard_ratio?.toFixed(2)}x (p &lt; 0.001)',
    'Hazard Ratio: {topDriver.hazard_ratio?.toFixed(2)}x (p {topDriver.p_value !== undefined ? (topDriver.p_value < 0.001 ? "< 0.001" : `= ${topDriver.p_value.toFixed(3)}`) : ""})'
)

with open(r"x:\login\frontend\src\app\leakage\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

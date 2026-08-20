import re

with open(r"x:\login\frontend\src\app\leakage\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace hardcoded 95% CI header and row with p_value
content = content.replace(
    '["Driver", "Primary Stage", "Affected Patients", "Hazard Ratio", "95% CI", "Impact Level"]',
    '["Driver", "Primary Stage", "Affected Patients", "Hazard Ratio", "P-Value", "Impact Level"]'
)

# Use regex to replace the td that renders the CI
pattern_td = r"<td style=\{\{ padding: \"12px 14px\", color: \"var\(--color-text-secondary\)\", fontSize: 12 \}\}>\s*\{d\.confidence_interval \? `\$\{.*?\} \: \".*?\"\}\s*</td>"
replacement_td = """<td style={{ padding: "12px 14px", color: "var(--color-text-secondary)", fontSize: 12 }}>
                        {d.p_value !== undefined ? (d.p_value < 0.001 ? "< 0.001" : d.p_value.toFixed(3)) : "N/A"}
                      </td>"""

content = re.sub(pattern_td, replacement_td, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\app\leakage\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

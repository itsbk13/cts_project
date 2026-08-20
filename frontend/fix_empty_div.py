import sys
import re

with open("src/components/risk/PatientRiskDrawer.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'<div\s*style=\{\{\s*padding:\s*"12px 14px",\s*background:\s*"var\(--color-bg\)",\s*border:\s*"1px solid var\(--color-border\)",\s*borderRadius:\s*8,\s*\}\}\s*>\s*</div>',
    '',
    content,
    flags=re.DOTALL
)

with open("src/components/risk/PatientRiskDrawer.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Removed empty container")

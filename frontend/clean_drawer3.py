import sys

with open('src/components/risk/PatientRiskDrawer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
content = re.sub(
    r'\{\s*/\*\s*"?"? WHY THIS PATIENT IS AT RISK.*?</p>\s*</div>',
    '',
    content,
    flags=re.DOTALL
)

with open('src/components/risk/PatientRiskDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned the last block")

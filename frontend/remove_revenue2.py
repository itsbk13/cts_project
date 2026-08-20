import os
import re

def remove_line_with(filepath, patterns):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    skip = False
    for i, line in enumerate(lines):
        if any(p in line for p in patterns):
            continue
        new_lines.append(line)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

# src/app/page.tsx
with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'<div style={{ flex: 1, minWidth: 140 }}>.*?Estimated Revenue at Risk\s*</div>\s*</div>', '', content, flags=re.DOTALL)
with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# src/app/funnel/page.tsx
with open('src/app/funnel/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'<div style={{ flex: 1 }}>\s*<span className="text-meta">PA Revenue Risk</span>.*?</div>', '', content, flags=re.DOTALL)
with open('src/app/funnel/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# src/app/leakage/page.tsx
with open('src/app/leakage/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'<div style={{ flex: 1, minWidth: 160 }}>\s*<span className="text-kpi-label">PA-Attributed Revenue Risk</span>.*?</div>\s*</div>', '', content, flags=re.DOTALL)
with open('src/app/leakage/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# src/components/leakage/LeakageDrawer.tsx
with open('src/components/leakage/LeakageDrawer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'<KPICard\s*label="Estimated Revenue at Risk".*?/>', '', content, flags=re.DOTALL)
with open('src/components/leakage/LeakageDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Charts
remove_line_with('src/components/overview/RegionalLeakageChart.tsx', ['Revenue at risk:'])
remove_line_with('src/components/cohort/RegionalComparisonChart.tsx', ['Revenue at risk:'])

# src/components/risk/PatientRiskDrawer.tsx
with open('src/components/risk/PatientRiskDrawer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = re.sub(r'<div style={{ padding: "16px 20px" }}>\s*<span className="text-kpi-label">Estimated Revenue at Risk</span>.*?</div>\s*</div>', '', content, flags=re.DOTALL)
with open('src/components/risk/PatientRiskDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished removing revenue at risk")

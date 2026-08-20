import sys
import re
import os

def remove_blocks(file_path, patterns):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for pattern, repl in patterns:
        content = re.sub(pattern, repl, content, flags=re.DOTALL)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

remove_blocks('src/app/page.tsx', [
    (r'<div style={{ flex: 1, minWidth: 140 }}>\s*<div className="text-kpi-value">\s*\{formatCurrency\(data\.kpis\.revenue_at_risk\)\}\s*</div>\s*<div className="text-kpi-label" style={{ marginTop: 2 }}>\s*Estimated Revenue at Risk\s*</div>\s*</div>', '')
])

remove_blocks('src/app/funnel/page.tsx', [
    (r'<div style={{ flex: 1 }}>\s*<span className="text-meta">PA Revenue Risk</span>\s*<div style={{ fontSize: 16, fontWeight: 700, color: "var\(--color-danger\)" }}>\s*\{formatCurrency\(3400000\)\}\s*</div>\s*</div>', '')
])

remove_blocks('src/app/leakage/page.tsx', [
    (r'<div style={{ flex: 1, minWidth: 160 }}>\s*<span className="text-kpi-label">PA-Attributed Revenue Risk</span>\s*<div className="text-kpi-value">\s*\{formatCurrency\(primaryStage\.revenue_at_risk\)\}\s*</div>\s*</div>', '')
])

remove_blocks('src/components/leakage/LeakageDrawer.tsx', [
    (r'<KPICard\s*label="Estimated Revenue at Risk"\s*value=\{formatCurrency\(data\.revenue_at_risk\)\}\s*tone="danger"\s*icon=\{<AlertTriangle size=\{16\} />\}\s*/>', '')
])

remove_blocks('src/components/overview/RegionalLeakageChart.tsx', [
    (r'<br />\s*Revenue at risk: <strong>\{formatCurrency\(d\.revenue_at_risk\)\}</strong>', '')
])

remove_blocks('src/components/cohort/RegionalComparisonChart.tsx', [
    (r'<br />\s*Revenue at risk: \{formatCurrency\(d\.revenue_at_risk\)\}', '')
])

remove_blocks('src/components/risk/PatientRiskDrawer.tsx', [
    (r'<div style={{ padding: "16px 20px" }}>\s*<span className="text-kpi-label">Estimated Revenue at Risk</span>\s*<div className="text-kpi-value" style={{ color: "var\(--color-danger\)" }}>\s*\{formatCurrency\(data\.estimated_revenue_at_risk\)\}\s*</div>\s*</div>', '')
])

print("Removed revenue at risk UI elements")

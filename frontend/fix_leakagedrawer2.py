import sys

with open("src/components/leakage/LeakageDrawer.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
# Replace KPICard with MetricBox
content = content.replace('<KPICard label="Patients Affected" value={data.patients_affected.toString()} tone="default" icon={<Users size={16} />} />', '<MetricBox icon={<Users size={16} color="var(--color-primary)" />} label="Patients Affected" value={formatNumber(data.patients_affected)} />')

content = content.replace('<KPICard label="Dropoff Rate" value={(data.dropoff_rate * 100).toFixed(1) + "%"} tone="warning" icon={<AlertTriangle size={16} />} />', '<MetricBox icon={<TrendingDown size={16} color="var(--color-warning)" />} label="Dropoff Rate" value={formatPercent(data.dropoff_rate)} />')

with open("src/components/leakage/LeakageDrawer.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed imports issues")

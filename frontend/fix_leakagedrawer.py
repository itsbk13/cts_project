with open("src/components/leakage/LeakageDrawer.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if "{/* " in line and "Metric Snapshot Grid" in line:
        new_lines.append(line)
        new_lines.append('      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>\n')
        new_lines.append('        <KPICard label="Patients Affected" value={data.patients_affected.toString()} tone="default" icon={<Users size={16} />} />\n')
        new_lines.append('        <KPICard label="Dropoff Rate" value={(data.dropoff_rate * 100).toFixed(1) + "%"} tone="warning" icon={<AlertTriangle size={16} />} />\n')
        new_lines.append('      </div>\n')
        continue
    if "</div>" in line and i == 66: # Line 67 is index 66
        continue
    new_lines.append(line)

with open("src/components/leakage/LeakageDrawer.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

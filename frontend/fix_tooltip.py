import re

with open(r"x:\login\frontend\src\components\leakage\LeakageDriverChart.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"\{d\.confidence_interval && \(.*?\}\)"
replacement = """{d.p_value !== undefined && (
          <p style={{ margin: "2px 0", fontSize: 11, color: "var(--color-text-muted)" }}>
            P-Value: {d.p_value < 0.001 ? "< 0.001" : d.p_value.toFixed(3)}
          </p>
        )}"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\components\leakage\LeakageDriverChart.tsx", "w", encoding="utf-8") as f:
    f.write(content)

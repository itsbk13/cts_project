import re

with open(r"x:\login\frontend\src\types\analytics.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace CohortHeatmapCell
pattern = r"export interface CohortHeatmapCell \{.*?\}"
replacement = """export interface CohortHeatmapCell {
  cohort_month: string;
  total_patients: number;
  retention_rates: (number | null)[];
}"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\types\analytics.ts", "w", encoding="utf-8") as f:
    f.write(content)

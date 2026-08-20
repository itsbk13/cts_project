import re

with open(r"x:\login\frontend\src\services\analyticsApi.ts", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"heatmap: Array<\{ region: string; month: string; dropoff_rate: number; patient_count: number \}>;"
replacement = """heatmap: import("@/types/analytics").CohortHeatmapCell[];"""

content = re.sub(pattern, replacement, content)

with open(r"x:\login\frontend\src\services\analyticsApi.ts", "w", encoding="utf-8") as f:
    f.write(content)

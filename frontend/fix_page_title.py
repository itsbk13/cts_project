import re

with open(r"x:\login\frontend\src\app\cohorts\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'title="Regional Journey Heatmap (Region A- Diagnosis Month)"\n          subtitle="Cohort drop-off intensity across geographies and intake enrollment months"',
    'title="Acquisition Cohort Analysis"\n          subtitle="Tracking cohort retention and drop-off across patient journey months"'
)

# And in case there is a weird dash character in region A-
content = re.sub(
    r'title="Regional Journey Heatmap.*?"\s+subtitle=".*?"',
    'title="Acquisition Cohort Analysis"\n          subtitle="Tracking cohort retention and drop-off across patient journey months"',
    content
)

with open(r"x:\login\frontend\src\app\cohorts\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

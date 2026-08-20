import re

with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad = r"structured:\s*\{\s*insight:\s*\"Conversation reset[^\}]+\},"
good = "text: \"Conversation reset. Ask any question about your patient cohort or funnel performance. Connected to active 5,000-patient journey dataset.\","
content = re.sub(bad, good, content)

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

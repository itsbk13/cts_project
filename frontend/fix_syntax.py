with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad = """      text: "Prior Authorization is the primary journey bottleneck, experiencing 18.3% leakage across the active cohort. Deploy patient services triage specialists to follow up with payers on submissions pending >7 days.",
  ]);"""

good = """      text: "Prior Authorization is the primary journey bottleneck, experiencing 18.3% leakage across the active cohort. Deploy patient services triage specialists to follow up with payers on submissions pending >7 days.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);"""

content = content.replace(bad, good)

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

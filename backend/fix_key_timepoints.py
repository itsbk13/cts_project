import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

bad_pattern = r"\"key_timepoints\": \[{\"days\": 30, \"probability\": 0\.85, \"label\": \"Day 30\"}\],"

good_code = """
"key_timepoints": [{"days": t, "probability": next((c["survival_probability"] for c in curves if c["time"] == t), 0), "label": f"Day {t}"} for t in [30, 60, 90] if any(c["time"] == t for c in curves)],
"""

content = re.sub(bad_pattern, good_code, content)

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)

import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

bad_pattern = r"\"median_survival_days\": 42,"

good_code = """
"median_survival_days": next((c["time"] for c in curves if c["survival_probability"] <= 0.5), 0),
"""

content = re.sub(bad_pattern, good_code, content)

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)

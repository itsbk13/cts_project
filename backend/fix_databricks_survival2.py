import re

with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"groups": survival_groups', '"groups": ["Overall"]')

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)

import re

with open(r"x:\login\frontend\src\lib\api.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const token = localStorage.getItem("token") || "test-token";',
    'const token = localStorage.getItem("token") || localStorage.getItem("hospital_id") || "hosp_1787066920";'
)

with open(r"x:\login\frontend\src\lib\api.ts", "w", encoding="utf-8") as f:
    f.write(content)

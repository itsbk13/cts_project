import re

with open(r"x:\login\frontend\src\lib\api.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("hosp_1787066920", "test_1000")

with open(r"x:\login\frontend\src\lib\api.ts", "w", encoding="utf-8") as f:
    f.write(content)

with open(r"x:\login\frontend\src\services\analyticsApi.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("hosp_1787066920", "test_1000")

with open(r"x:\login\frontend\src\services\analyticsApi.ts", "w", encoding="utf-8") as f:
    f.write(content)

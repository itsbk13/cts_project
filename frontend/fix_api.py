import re

with open(r"x:\login\frontend\src\lib\api.ts", "r", encoding="utf-8") as f:
    content = f.read()

pattern_filter = r"if \(filters\.region !== \"All\"\)\s+\{\s+heatmap = heatmap\.filter\(\(h\) => h\.region\.toLowerCase\(\) === filters\.region\.toLowerCase\(\)\);\s+\}"
content = re.sub(pattern_filter, "", content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\lib\api.ts", "w", encoding="utf-8") as f:
    f.write(content)

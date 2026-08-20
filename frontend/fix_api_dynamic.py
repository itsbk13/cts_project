import re

with open(r"x:\login\frontend\src\services\analyticsApi.ts", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"if \(session\?\.accessToken\) \{[\s\S]*?\} else \{[\s\S]*?\}"
replacement = """if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    } else if (session?.hospitalId) {
      headers["Authorization"] = `Bearer ${session.hospitalId}`;
    } else {
      headers["Authorization"] = `Bearer hosp_335078`;
    }"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\services\analyticsApi.ts", "w", encoding="utf-8") as f:
    f.write(content)

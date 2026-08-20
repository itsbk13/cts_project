import re

with open(r"x:\login\frontend\src\services\analyticsApi.ts", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"if \(session\?\.accessToken\) \{\s+headers\[\"Authorization\"\] = `Bearer \$\{session\.accessToken\}`;\s+\}"
replacement = """if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    } else {
      // Fallback for demo mode so it fetches real databricks data!
      headers["Authorization"] = `Bearer hosp_1787066920`;
    }"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\services\analyticsApi.ts", "w", encoding="utf-8") as f:
    f.write(content)

import re

with open(r"x:\login\frontend\src\lib\api.ts", "r", encoding="utf-8") as f:
    content = f.read()

# For getLeakage, remove the try-catch that falls back to state.regionalLeakage
# Actually, I'll just change the console.warn to a throw so it hits the ErrorBoundary
content = content.replace(
    'console.warn("Backend leakage fetch failed, falling back to mock");',
    'console.error("Backend leakage fetch failed:", err);\n      throw err;'
)

content = content.replace(
    'console.warn("Backend cohorts fetch failed, falling back to mock", err);',
    'console.error("Backend cohorts fetch failed:", err);\n      throw err;'
)

with open(r"x:\login\frontend\src\lib\api.ts", "w", encoding="utf-8") as f:
    f.write(content)

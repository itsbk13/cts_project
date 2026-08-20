import os
import re

with open("src/lib/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'if (!res.ok) throw new Error("Failed to fetch patient detail");',
    'if (!res.ok) return null as any;'
)
content = content.replace(
    'if (!res.ok) throw new Error("Failed to fetch patient SHAP");',
    'if (!res.ok) return null as any;'
)
content = content.replace(
    'console.error("Failed to fetch patient detail:", err);',
    '// console.error("Failed to fetch patient detail:", err);'
)
content = content.replace(
    'console.error("Failed to fetch patient SHAP:", err);',
    '// console.error("Failed to fetch patient SHAP:", err);'
)

with open("src/lib/api.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated api.ts")

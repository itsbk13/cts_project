import re

with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace structured rendering with simple text rendering
bad_pattern = r"                    \{/\* EVIDENCE \*/\}.*?\{/\* RECOMMENDED ACTION \*/\}.*?</div>\n                    \)\}\n                  </div>"
good_code = """                  </div>"""
content = re.sub(bad_pattern, good_code, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

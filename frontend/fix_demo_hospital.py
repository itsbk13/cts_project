import re

with open(r"x:\login\frontend\src\lib\auth.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the random HSP- math floor with extracting the userId
pattern = r"hospitalId: `HSP-\$\{Math\.floor\(1000 \+ Math\.random\(\) \* 9000\)\}`,"
replacement = """hospitalId: userId.trim().toUpperCase().startsWith("USER-") ? userId.trim() : `HSP-${Math.floor(1000 + Math.random() * 9000)}`,"""

content = re.sub(pattern, replacement, content)

with open(r"x:\login\frontend\src\lib\auth.ts", "w", encoding="utf-8") as f:
    f.write(content)

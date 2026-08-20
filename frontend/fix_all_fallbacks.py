import re

with open(r"x:\login\frontend\src\lib\api.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace all console.warn("Backend ... falling back to mock") with console.error and throw
content = re.sub(
    r'console\.warn\("Backend (.*?) fetch failed, falling back to mock"\);',
    r'console.error("Backend \1 fetch failed"); throw new Error("Backend \1 fetch failed");',
    content
)

# And if there are any instances passing `err`
content = re.sub(
    r'console\.warn\("Backend (.*?) fetch failed, falling back to mock", err\);',
    r'console.error("Backend \1 fetch failed", err); throw err;',
    content
)

with open(r"x:\login\frontend\src\lib\api.ts", "w", encoding="utf-8") as f:
    f.write(content)

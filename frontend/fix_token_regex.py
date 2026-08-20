import sys
import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Make sure we import getCurrentUser
if 'import { getCurrentUser }' not in content:
    content = content.replace('import { useDatasetStore }', 'import { getCurrentUser } from "@/lib/auth";\nimport { useDatasetStore }')

# Replace the exact token fetching lines
content = re.sub(r'const token = localStorage\.getItem\("access_token"\);', r'const user = getCurrentUser();\n    const token = user?.accessToken;', content)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Fixed token via regex")

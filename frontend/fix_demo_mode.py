import sys

with open('src/app/risk/page.tsx', 'r') as f:
    content = f.read()

content = content.replace('{new Date().toLocaleDateString()} (Demo Mode)', '{lookupResult.last_updated || new Date().toLocaleDateString()}')

with open('src/app/risk/page.tsx', 'w') as f:
    f.write(content)

print("Removed Demo Mode wording")

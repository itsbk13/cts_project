import sys

with open('src/app/risk/page.tsx', 'r') as f:
    content = f.read()

# Change the default useState
content = content.replace('useState("PT-10001")', 'useState("")')

with open('src/app/risk/page.tsx', 'w') as f:
    f.write(content)

with open('src/app/shap/page.tsx', 'r') as f:
    content = f.read()

# Change the default useState
content = content.replace('useState("PT-10001")', 'useState("")')

with open('src/app/shap/page.tsx', 'w') as f:
    f.write(content)

print("Removed PT-10001 default.")

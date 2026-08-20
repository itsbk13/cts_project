import sys

with open('src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()

content = content.replace('{metadata.isCustom ? "Custom File" : "Demo Dataset"}', '{metadata.isCustom ? "Live Connection" : "Live Connection"}')

with open('src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(content)

print("Updated Sidebar.")

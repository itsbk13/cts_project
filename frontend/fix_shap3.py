import sys
import re

with open('src/app/shap/page.tsx', 'r') as f:
    content = f.read()

# Fix the title interpolation
content = content.replace("title={Individual Feature Contributions: }", "title={`Individual Feature Contributions: ${patientData.patient_id}`}")

# Remove Global View section. Find the start of the comment and the end of the file/div.
start_idx = content.find('{/*')
while start_idx != -1:
    if 'GLOBAL VIEW' in content[start_idx:start_idx+100]:
        # found the block, remove everything from here to the end div
        end_idx = content.rfind('</div>')
        if end_idx != -1 and end_idx > start_idx:
            content = content[:start_idx] + '\n' + content[end_idx:]
            break
    start_idx = content.find('{/*', start_idx + 1)

with open('src/app/shap/page.tsx', 'w') as f:
    f.write(content)

print("Fixed SHAP page correctly.")

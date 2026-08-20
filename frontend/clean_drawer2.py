import sys

with open('src/components/risk/PatientRiskDrawer.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i in range(len(lines)):
    line = lines[i]
    if 'WHY THIS PATIENT IS AT RISK' in line:
        skip = True
    elif 'RECOMMENDED ACTION' in line:
        skip = True
    elif 'Deep Dive Link to SHAP' in line:
        skip = True
    
    if skip and '</div>' in line:
        # Wait, if we just skip based on comments it might be messy because of div matching.
        pass

# Actually let's do it cleanly by searching for the strings and removing the block

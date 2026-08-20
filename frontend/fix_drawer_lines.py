with open("src/components/risk/PatientRiskDrawer.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = lines[:247] + lines[269:]

with open("src/components/risk/PatientRiskDrawer.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

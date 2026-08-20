with open("src/components/risk/PatientRiskDrawer.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("drawer_dump.txt", "w", encoding="utf-8") as f:
    for i, line in enumerate(lines):
        f.write(f"{i+1:3d}: {line}")

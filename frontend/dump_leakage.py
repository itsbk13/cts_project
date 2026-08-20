with open("src/app/leakage/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
with open("leakage_dump.txt", "w", encoding="utf-8") as f:
    for i, line in enumerate(lines):
        f.write(f"{i+1:3d}: {line}")

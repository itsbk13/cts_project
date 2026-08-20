with open("src/components/overview/JourneyPathway.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines[150:175]):
    print(f"{151 + i}: {line.strip()}")

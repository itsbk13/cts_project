with open("src/components/overview/JourneyPathway.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines[-50:]):
    print(f"{len(lines) - 50 + i + 1}: {line.strip()}")

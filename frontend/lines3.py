with open("src/components/overview/JourneyPathway.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines[160:175]):
    try:
        print(f"{161 + i}: {line.strip()}")
    except:
        print(f"{161 + i}: [UNICODE ERROR LINE]")

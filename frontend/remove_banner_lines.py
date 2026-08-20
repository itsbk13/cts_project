with open("src/components/overview/JourneyPathway.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = lines[:166] + lines[223:]

with open("src/components/overview/JourneyPathway.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Removed banner lines 167-223")

import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace('import("@/types/analytics").JourneyStage', 'import("@/types/patient").JourneyStage')

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

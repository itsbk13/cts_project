import sys

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_funnel = '''    const stages: import("@/types/analytics").FunnelStage[] = stageLabels.map(
      (stage, i) => ({
        stage,'''

new_funnel = '''    const stages: import("@/types/analytics").FunnelStage[] = stageLabels.map(
      (stage, i) => ({
        stage: stage as import("@/types/analytics").JourneyStage,'''

content = content.replace(old_funnel, new_funnel)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

print("Updated FunnelStage in api.ts successfully.")

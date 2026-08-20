import re

with open("src/components/overview/JourneyPathway.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'\{\/\* "\?"\? Primary Bottleneck Attached Banner .*?<\/div>\s*<\/div>'
new_content = re.sub(pattern, '</div>', content, flags=re.DOTALL)

with open("src/components/overview/JourneyPathway.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Removed Primary Bottleneck Attached Banner")

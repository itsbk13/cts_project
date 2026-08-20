import sys

with open('src/app/risk/page.tsx', 'r') as f:
    content = f.read()

old_effect = '''  useEffect(() => {
    load();
    handleAnalyze();
  }, [load, handleAnalyze, region, diagnosis, insurance, provider, newExisting]);'''

new_effect = '''  useEffect(() => {
    load();
  }, [load, region, diagnosis, insurance, provider, newExisting]);'''

content = content.replace(old_effect, new_effect)

with open('src/app/risk/page.tsx', 'w') as f:
    f.write(content)

print("Fixed risk page useEffect infinite loop")

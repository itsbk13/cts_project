import json

logfile = r"C:\Users\Hemananth\.gemini\antigravity\brain\25b991ff-9a0d-4f8f-b2fc-5bebe61e46ee\.system_generated\logs\transcript_full.jsonl"

with open(logfile, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Check all 4 responses
for idx in [2871, 2873, 2911, 2913]:
    obj = json.loads(lines[idx])
    content = str(obj.get("content", ""))
    print(f"Line {idx}: length={len(content)}")

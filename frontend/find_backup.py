import json

logfile = r"C:\Users\Hemananth\.gemini\antigravity\brain\25b991ff-9a0d-4f8f-b2fc-5bebe61e46ee\.system_generated\logs\transcript_full.jsonl"

with open(logfile, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Find any line that shows funnel page with big Comprehensive table
for i in range(len(lines)-1, -1, -1):
    line = lines[i]
    if "Comprehensive Journey" in line and "LeakageDrawer" in line and len(line) > 30000:
        print(f"Found at line {i}, length={len(line)}")
        obj = json.loads(line)
        content = str(obj.get("content", ""))
        with open("x:/login/frontend/funnel_backup.txt", "w", encoding="utf-8") as out:
            out.write(content)
        print("Saved")
        break

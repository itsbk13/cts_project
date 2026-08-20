import json

logfile = r"C:\Users\Hemananth\.gemini\antigravity\brain\25b991ff-9a0d-4f8f-b2fc-5bebe61e46ee\.system_generated\logs\transcript_full.jsonl"

with open(logfile, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Line 2871 is the response to view_file on line 2870
obj = json.loads(lines[2871])
content = str(obj.get("content", ""))
print(f"Content length: {len(content)}")
with open("x:/login/frontend/funnel_backup.txt", "w", encoding="utf-8") as out:
    out.write(content)
print("Saved to funnel_backup.txt")

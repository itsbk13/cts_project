import json

logfile = r"C:\Users\Hemananth\.gemini\antigravity\brain\25b991ff-9a0d-4f8f-b2fc-5bebe61e46ee\.system_generated\logs\transcript_full.jsonl"

with open(logfile, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Find all tool_calls with view_file on funnel page
for i, line in enumerate(lines):
    try:
        obj = json.loads(line)
        for tc in obj.get("tool_calls", []):
            args = tc.get("args", {})
            if "funnel" in str(args.get("AbsolutePath","")).lower() and "page.tsx" in str(args.get("AbsolutePath","")):
                print(f"Line {i}: view_file funnel/page.tsx")
    except:
        pass

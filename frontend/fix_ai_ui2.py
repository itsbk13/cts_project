import re

with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace structured interface definitions
content = re.sub(r"interface StructuredResponse \{.*?\n\}", "", content, flags=re.DOTALL)
content = re.sub(r"structured\?: StructuredResponse;", "", content)
content = re.sub(r"structured: answer,", "text: answer,", content)
content = re.sub(r"structured: \{.*?\n    \},", "text: \"Prior Authorization is the primary journey bottleneck, experiencing 18.3% leakage across the active cohort. Deploy patient services triage specialists to follow up with payers on submissions pending >7 days.\",", content, flags=re.DOTALL)

# Replace rendering
bad_render = r"                \{isUser \? \(.*?\) : \(.*?\{/\* Structured AI Output Layout \*/\}.*?\n                  \)\}"
good_render = """                {isUser ? (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      fontSize: 13,
                      background: "var(--color-teal)",
                      color: "white",
                      lineHeight: 1.5,
                      boxShadow: "0 1px 4px rgba(15,118,110,0.2)",
                    }}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px 18px",
                      borderRadius: 8,
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      fontSize: 14,
                      color: "var(--color-navy)",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {msg.text}
                  </div>
                )}"""
content = re.sub(bad_render, good_render, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

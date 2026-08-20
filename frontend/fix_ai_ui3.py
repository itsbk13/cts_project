with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the reset button structured block
bad_reset = """                {
                  id: "init-1",
                  sender: "ai",
                  structured: {
                    insight: "Conversation reset. Ask any question about your patient cohort or funnel performance.",
                    evidence: "Connected to active 5,000-patient journey dataset.",
                    drivers: [],
                    action: "Select a prompt below or type your inquiry.",
                  },
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },"""
good_reset = """                {
                  id: "init-1",
                  sender: "ai",
                  text: "Conversation reset. Ask any question about your patient cohort or funnel performance.",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },"""
content = content.replace(bad_reset, good_reset)

# Replace rendering block
start_str = "                {isUser ? ("
end_str = "                  <span className=\"text-meta\" style={{ fontSize: 10 }}>"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

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
                )}
"""

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + good_render + content[end_idx:]

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

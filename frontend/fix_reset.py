with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

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
                  text: "Conversation reset. Ask any question about your patient cohort or funnel performance. Connected to active 5,000-patient journey dataset.",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },"""

content = content.replace(bad_reset, good_reset)

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

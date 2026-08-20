import re

with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add ReactMarkdown import
if "import ReactMarkdown" not in content:
    content = content.replace("import React, { useState } from \"react\";", "import React, { useState, useEffect } from \"react\";\nimport ReactMarkdown from \"react-markdown\";")

# 2. Add local storage cache logic
state_block_bad = """  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: "Prior Authorization is the primary journey bottleneck, experiencing 18.3% leakage across the active cohort. Deploy patient services triage specialists to follow up with payers on submissions pending >7 days.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);"""

state_block_good = """  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem("ai_chat_history");
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    } else {
      setMessages([
        {
          id: "init-1",
          sender: "ai",
          text: "Hi! I'm your Patient Journey Copilot. Ask me any question about your patient cohort, funnel performance, or leakage drivers.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ai_chat_history", JSON.stringify(messages));
    }
  }, [messages, isLoaded]);"""

content = content.replace(state_block_bad, state_block_good)

# Prevent hydration error by returning null if not loaded
if "if (!isLoaded) return null;" not in content:
    content = content.replace("  return (\n    <div", "  if (!isLoaded) return null;\n\n  return (\n    <div")

# 3. Use ReactMarkdown for rendering AI text beautifully
ai_text_bad = """                  <div
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
                  </div>"""

ai_text_good = """                  <div
                    style={{
                      padding: "16px 18px",
                      borderRadius: 8,
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      fontSize: 14,
                      color: "var(--color-navy)",
                      lineHeight: 1.6,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                    className="markdown-body"
                  >
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p style={{ marginBottom: "0.75em" }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ listStyleType: "disc", paddingLeft: "1.5em", marginBottom: "0.75em", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ listStyleType: "decimal", paddingLeft: "1.5em", marginBottom: "0.75em", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
                        li: ({node, ...props}) => <li {...props} />,
                        strong: ({node, ...props}) => <strong style={{ fontWeight: 600, color: "var(--color-text-primary)" }} {...props} />,
                      }}
                    >
                      {msg.text || ""}
                    </ReactMarkdown>
                  </div>"""

content = content.replace(ai_text_bad, ai_text_good)

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

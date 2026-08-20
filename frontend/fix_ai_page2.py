with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_str = "    try {\n      const response = await askAI({ question: q });"
end_str = "    } catch {"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    good_code = """    try {
      const { sendChatMessage } = await import("@/services/chatApi");
      const answer = await sendChatMessage([...messages, userMsg]);
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        structured: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
"""
    content = content[:start_idx] + good_code + content[end_idx:]
    with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
        f.write(content)
else:
    print("Could not find start or end block")

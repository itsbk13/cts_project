import re

with open(r"x:\login\frontend\src\app\ai\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the fake handleSend logic
bad_pattern = r"const handleSend = async \(queryText\?: string\) => \{.*?\n      } catch \{"
good_code = """const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    try {
      // Use the actual backend chat endpoint
      const { sendChatMessage } = await import("@/services/chatApi");
      const answer = await sendChatMessage([...messages, userMsg]);
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        structured: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {"""

content = re.sub(bad_pattern, good_code, content, flags=re.DOTALL)

with open(r"x:\login\frontend\src\app\ai\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

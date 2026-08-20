import { ChatMessage } from "@/types/ai";
import { getCurrentUser } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function sendChatMessage(messages: any[], patientId?: string): Promise<any> {
  const session = getCurrentUser();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  } else if (session?.hospitalId) {
    headers["Authorization"] = `Bearer ${session.hospitalId}`;
  } else {
    headers["Authorization"] = `Bearer hosp_335078`;
  }

  // Format messages for backend
  const formattedMessages = messages.map(m => ({
    role: m.role || (m.sender === "user" ? "user" : "assistant"),
    content: m.content || m.text || JSON.stringify(m.structured)
  }));

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages: formattedMessages,
      patient_id: patientId || null
    })
  });

  if (!response.ok) {
    throw new Error("Failed to get a response from the AI Copilot.");
  }

  const data = await response.json();
  return data.answer;
}

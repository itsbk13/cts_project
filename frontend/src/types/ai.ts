// ============================================================
// AI Assistant types
// ============================================================

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

export interface AIContext {
  current_page?: string;
  selected_filters?: Record<string, string | string[]>;
  selected_patient_id?: string;
  selected_stage?: string;
}

export interface AIRequest {
  question: string;
  context?: AIContext;
  conversation_history?: ChatMessage[];
}

export interface AIResponse {
  answer: string;
  sources?: string[];
  suggested_actions?: string[];
  confidence?: number;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  question: string;
  category: "leakage" | "risk" | "regional" | "intervention" | "general";
}

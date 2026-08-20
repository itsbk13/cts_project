"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askAI } from "@/lib/api";
import {
  Sparkles,
  Send,
  User,
  Bot,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";

// ============================================================
// Page 8 — AI Copilot (Decision-Support Interface)
// Purpose: "Ask questions about your patient journey analytics."
// ============================================================



interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text?: string;
  
  timestamp: string;
}

const AI_PAGE_PROMPTS = [
  "Why is the highest leakage at Prior Authorization?",
  "Why are patients dropping off?",
  "Which cohort has the highest risk?",
  "Explain this patient's risk.",
  "What action should we take?",
];

export default function AIPage() {
  const [inputQuery, setInputQuery] = useState("");
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
  }, [messages, isLoaded]);

  const handleSend = async (queryText?: string) => {
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
      const { sendChatMessage } = await import("@/services/chatApi");
      const answer = await sendChatMessage([...messages, userMsg]);
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ai",
          text: "I encountered an issue analyzing the journey dataset. Please try asking again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - var(--header-height) - 48px)",
        maxWidth: 1040,
        margin: "0 auto",
        gap: 16,
      }}
    >
      {/* ── Page Header ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div>
          <h1 className="text-page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={20} color="var(--color-teal)" />
            Patient Journey AI Copilot
          </h1>
          <p className="text-meta" style={{ marginTop: 2 }}>
            Ask questions about your patient journey analytics.
          </p>
        </div>

        <button
          className="btn-ghost"
          style={{ fontSize: 12, gap: 4 }}
          onClick={() =>
            setMessages([
              {
                id: "init-1",
                sender: "ai",
                text: "Conversation reset. Ask any question about your patient cohort or funnel performance. Connected to active 5,000-patient journey dataset.",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ])
          }
        >
          <RefreshCw size={12} />
          Clear Conversation
        </button>
      </div>

      {/* ── Chat Messages Scroll Area ─────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                gap: 12,
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: isUser ? "75%" : "90%",
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "var(--color-primary-light)",
                    color: "var(--color-teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={17} />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  alignItems: isUser ? "flex-end" : "flex-start",
                  width: "100%",
                }}
              >
                {isUser ? (
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
                      lineHeight: 1.6,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                    className="markdown-body"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p style={{ marginBottom: "0.75em" }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ listStyleType: "disc", paddingLeft: "1.5em", marginBottom: "0.75em", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ listStyleType: "decimal", paddingLeft: "1.5em", marginBottom: "0.75em", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
                        li: ({node, ...props}) => <li {...props} />,
                        strong: ({node, ...props}) => <strong style={{ fontWeight: 600, color: "var(--color-text-primary)" }} {...props} />,
                        table: ({node, ...props}) => <div style={{ overflowX: "auto", marginBottom: "1em" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }} {...props} /></div>,
                        thead: ({node, ...props}) => <thead style={{ backgroundColor: "var(--color-surface)", borderBottom: "2px solid var(--color-border)" }} {...props} />,
                        tbody: ({node, ...props}) => <tbody {...props} />,
                        tr: ({node, ...props}) => <tr style={{ borderBottom: "1px solid var(--color-border)" }} {...props} />,
                        th: ({node, ...props}) => <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--color-navy)" }} {...props} />,
                        td: ({node, ...props}) => <td style={{ padding: "8px 12px", color: "var(--color-text-primary)" }} {...props} />,
                      }}
                    >
                      {msg.text || ""}
                    </ReactMarkdown>
                  </div>
                )}

                <span className="text-meta" style={{ fontSize: 10 }}>
                  {msg.timestamp}
                </span>
              </div>

              {isUser && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "var(--color-navy)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={17} />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: "var(--color-primary-light)",
                color: "var(--color-teal)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={17} />
            </div>
            <div
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                fontSize: 12,
                color: "var(--color-text-secondary)",
              }}
            >
              Synthesizing journey models &amp; structuring recommendations...
            </div>
          </div>
        )}
      </div>

      {/* ── Suggested Questions Carousel ──────────────────────── */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, flexShrink: 0 }}>
        {AI_PAGE_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            style={{
              padding: "6px 13px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 16,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-teal)";
              e.currentTarget.style.color = "var(--color-teal)";
              e.currentTarget.style.background = "var(--color-primary-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-primary)";
              e.currentTarget.style.background = "var(--color-surface)";
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Chat Input ────────────────────────────────────────── */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ display: "flex", gap: 10, flexShrink: 0 }}
      >
        <input
          type="text"
          placeholder="Ask anything about journey drop-offs, PA processing times, or risk triage..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: 13,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--control-radius)",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!inputQuery.trim() || isTyping}
          style={{
            padding: "0 20px",
            opacity: !inputQuery.trim() || isTyping ? 0.5 : 1,
          }}
        >
          <Send size={14} />
          <span>Send Inquiry</span>
        </button>
      </form>
    </div>
  );
}

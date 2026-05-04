"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import { ToolResultCard } from "./tool-result-card";

interface ToolResult {
  toolName: string;
  data: unknown;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolResults?: ToolResult[];
}

const SUGGESTIONS = [
  "List all employees",
  "Show me Alice's performance stats",
  "What's the timesheet approval rate?",
  "Give me a project summary",
  "Which tasks are in progress?",
  "Show attendance summary",
];

export function AdminChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${err.error || "Something went wrong"}`,
          },
        ]);
        return;
      }

      const data = await res.json();

      // Strip tool_result code blocks from the display text — we render them separately
      const cleanedContent = data.content
        .replace(/```tool_result\n[\s\S]*?\n```/g, "")
        .trim();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanedContent,
          toolResults: data.toolResults,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="surface-card flex h-[calc(100vh-200px)] min-h-[500px] flex-col overflow-hidden">
      {/* Message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <EmptyState onSuggestion={sendMessage} />
        ) : (
          <div className="space-y-5">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {loading && <ThinkingIndicator />}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about employees, tasks, timesheets..."
            autoComplete="off"
            className="h-11 flex-1 rounded-[12px] border border-border bg-[color:var(--surface-2)] px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-11 items-center gap-1.5 rounded-[12px] bg-[color:var(--primary)] px-5 text-sm font-semibold text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--primary-soft)]">
        <Sparkles className="h-8 w-8 text-[color:var(--primary)]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Admin AI Assistant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask me anything about your team. I can look up employee data, task
          progress, timesheet analytics, and more.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="rounded-[10px] border border-border bg-[color:var(--surface-2)] px-3.5 py-2.5 text-left text-sm text-foreground transition-colors hover:border-[color:var(--primary)]/40 hover:bg-[color:var(--primary-soft)]/50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={"flex gap-3 " + (isUser ? "flex-row-reverse" : "")}>
      {/* Avatar */}
      <span
        className={
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
          (isUser
            ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
            : "bg-[color:var(--primary-soft)] text-[color:var(--primary)]")
        }
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>

      {/* Content */}
      <div
        className={
          "flex max-w-[85%] flex-col gap-2 " +
          (isUser ? "items-end" : "items-start")
        }
      >
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {isUser ? "You" : "AI Assistant"}
          </span>
          {!isUser && (
            <span className="inline-flex items-center gap-0.5 text-[color:var(--primary)]">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          )}
        </div>

        {/* Text bubble */}
        <div
          className={
            "rounded-[14px] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words " +
            (isUser
              ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
              : "bg-[color:var(--secondary)] text-foreground")
          }
        >
          {message.content}
        </div>

        {/* Tool results */}
        {message.toolResults && message.toolResults.length > 0 && (
          <div className="mt-1 flex w-full flex-col gap-3">
            {message.toolResults.map((tr, i) => (
              <ToolResultCard key={i} toolName={tr.toolName} data={tr.data} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)]">
        <Bot className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-2 rounded-[14px] bg-[color:var(--secondary)] px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-[color:var(--primary)]" />
        <span className="text-sm text-muted-foreground">Analyzing data…</span>
      </div>
    </div>
  );
}

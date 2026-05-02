"use client";

import { useRef } from "react";
import { Send } from "lucide-react";

import { sendMessageAction } from "./actions";

export function ChatComposer() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await sendMessageAction(fd);
        formRef.current?.reset();
      }}
      className="flex items-center gap-2"
    >
      <input
        name="content"
        required
        autoComplete="off"
        placeholder="Message #general"
        className="h-10 flex-1 rounded-[10px] border border-border bg-surface px-3 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
      />
      <button
        type="submit"
        className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[color:var(--primary)] px-4 text-sm font-semibold text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90"
      >
        <Send className="h-4 w-4" />
        Send
      </button>
    </form>
  );
}

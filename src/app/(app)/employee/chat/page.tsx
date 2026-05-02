import { MessagesSquare } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { RoleBadge } from "@/components/timeline/role-badge";
import { ChatComposer } from "./composer";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(d: Date) {
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "short",
    day: "numeric",
  });
}

export default async function ChatPage() {
  const me = await requireSession();
  const messages = await prisma.message.findMany({
    include: { sender: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return (
    <>
      <PageHeader
        title="Team Chat"
        subtitle="One shared room for the workspace."
        actions={
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MessagesSquare className="h-3.5 w-3.5" />
            {messages.length} messages
          </span>
        }
      />
      <SectionCard
        title="#general"
        description="Everyone in the workspace can read and reply."
        bodyClassName="p-0"
      >
        <div className="flex h-[calc(100vh-280px)] min-h-[420px] flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                No messages yet. Start the conversation.
              </p>
            ) : (
              <ul className="space-y-4">
                {messages.map((m) => {
                  const isMe = m.sender.id === me.id;
                  return (
                    <li
                      key={m.id}
                      className={
                        "flex gap-3 " + (isMe ? "flex-row-reverse" : "")
                      }
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)] text-xs font-semibold">
                        {initials(m.sender.name)}
                      </span>
                      <div
                        className={
                          "flex max-w-[70%] flex-col gap-1 " +
                          (isMe ? "items-end" : "items-start")
                        }
                      >
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {isMe ? "You" : m.sender.name}
                          </span>
                          <RoleBadge role={m.sender.role} />
                          <span>{formatTime(m.createdAt)}</span>
                        </div>
                        <div
                          className={
                            "rounded-[14px] px-3.5 py-2 text-sm whitespace-pre-wrap break-words " +
                            (isMe
                              ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                              : "bg-secondary text-foreground")
                          }
                        >
                          {m.content}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="border-t border-border p-3">
            <ChatComposer />
          </div>
        </div>
      </SectionCard>
    </>
  );
}

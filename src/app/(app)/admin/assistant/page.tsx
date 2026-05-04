import { Sparkles } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/timeline/page-header";
import { AdminChatClient } from "./chat-client";

export const dynamic = "force-dynamic";

export default async function AdminAssistantPage() {
  await requireRole("ADMIN");

  return (
    <>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask anything about employees, tasks, timesheets, and projects."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--primary)]">
            <Sparkles className="h-3 w-3" />
            Gemini 2.0 Flash
          </span>
        }
      />
      <AdminChatClient />
    </>
  );
}

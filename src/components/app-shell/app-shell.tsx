import type { Role } from "@prisma/client";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import type { Notification } from "./notifications";

type Props = {
  user: { id: string; name: string; email: string; role: Role };
  projects: { id: string; name: string; color: string }[];
  notifications: Notification[];
  children: React.ReactNode;
};

export function AppShell({ user, projects, notifications, children }: Props) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} projects={projects} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} notifications={notifications} />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

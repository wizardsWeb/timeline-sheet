import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  ListTodo,
  Clock,
  Calendar,
  Users,
  MessagesSquare,
  CheckSquare,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  ServerCog,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = { label?: string; items: NavItem[] };

const employeeNav: NavGroup[] = [
  {
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/employee/tasks", label: "All Tasks", icon: ListTodo },
      { href: "/employee/timesheet", label: "Time Sheet", icon: Clock },
      { href: "/employee/calendar", label: "Calendar", icon: Calendar },
      { href: "/employee/members", label: "Members", icon: Users },
      { href: "/employee/chat", label: "Team Chat", icon: MessagesSquare },
    ],
  },
];

const managerNav: NavGroup[] = [
  {
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/manager/approvals", label: "Approvals", icon: CheckSquare },
      { href: "/manager/timesheets", label: "Team Timesheets", icon: Clock },
      { href: "/manager/tasks", label: "Tasks", icon: ListTodo },
      { href: "/employee/calendar", label: "Calendar", icon: Calendar },
      { href: "/employee/members", label: "Members", icon: Users },
      { href: "/manager/reports", label: "Reports", icon: BarChart3 },
      { href: "/employee/chat", label: "Team Chat", icon: MessagesSquare },
    ],
  },
];

const adminNav: NavGroup[] = [
  {
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: ShieldCheck },
      { href: "/admin/timesheets", label: "All Timesheets", icon: Clock },
      { href: "/admin/tasks", label: "All Tasks", icon: ClipboardList },
      { href: "/admin/system", label: "System", icon: ServerCog },
      { href: "/employee/chat", label: "Team Chat", icon: MessagesSquare },
    ],
  },
];

export function navFor(role: Role): NavGroup[] {
  if (role === "ADMIN") return adminNav;
  if (role === "MANAGER") return managerNav;
  return employeeNav;
}

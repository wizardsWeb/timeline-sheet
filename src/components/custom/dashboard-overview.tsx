"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStore } from "@/lib/store";
import type { DashboardSnapshot, RoleType } from "@/lib/types";

interface DashboardOverviewProps {
  snapshot: DashboardSnapshot;
}

function roleToTabValue(role: RoleType): string {
  return role.toLowerCase();
}

function tabValueToRole(value: string): RoleType {
  if (value === "manager") {
    return "MANAGER";
  }
  if (value === "admin") {
    return "ADMIN";
  }
  return "EMPLOYEE";
}

export function DashboardOverview({ snapshot }: DashboardOverviewProps) {
  const { currentRole, setRole } = useUserStore();
  const [tab, setTab] = useState<string>(roleToTabValue(currentRole));

  useEffect(() => {
    setTab(roleToTabValue(currentRole));
  }, [currentRole]);

  const stats = useMemo(() => {
    const employees = snapshot.users.filter((user) => user.role === "EMPLOYEE").length;
    const managers = snapshot.users.filter((user) => user.role === "MANAGER").length;
    const admins = snapshot.users.filter((user) => user.role === "ADMIN").length;
    const pendingTimesheets = snapshot.timesheets.filter((timesheet) => timesheet.status === "PENDING").length;
    const completedTasks = snapshot.tasks.filter((task) => task.status === "DONE").length;

    return {
      employees,
      managers,
      admins,
      pendingTimesheets,
      completedTasks,
      totalTasks: snapshot.tasks.length,
    };
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{snapshot.users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.employees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.managers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.pendingTimesheets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {stats.completedTasks}/{stats.totalTasks}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Workspaces</CardTitle>
          <CardDescription>
            Jump into the operational view for each role to run full workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={tab}
            onValueChange={(nextValue) => {
              setTab(nextValue);
              setRole(tabValueToRole(nextValue));
            }}
          >
            <TabsList>
              <TabsTrigger value="employee">Employee</TabsTrigger>
              <TabsTrigger value="manager">Manager</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            <TabsContent value="employee" className="mt-4">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  Log attendance, submit timesheets, track tasks, and generate AI evaluation.
                </p>
                <Button asChild>
                  <Link href="/employee">Open Employee Dashboard</Link>
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="manager" className="mt-4">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  Review pending logs, approve/reject with feedback, and assign new tasks.
                </p>
                <Button asChild>
                  <Link href="/manager">Open Manager Dashboard</Link>
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="admin" className="mt-4">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  Monitor users, role mix, system health, and approval activity.
                </p>
                <Button asChild>
                  <Link href="/admin">Open Admin Dashboard</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Architecture Status</CardTitle>
          <CardDescription>
            Multi-agent backend is active with isolated Attendance, Timesheet, Task, and Evaluation services.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/60 p-3 text-sm">Attendance Agent: Live</div>
          <div className="rounded-lg border border-border/60 p-3 text-sm">Timesheet Agent: Live</div>
          <div className="rounded-lg border border-border/60 p-3 text-sm">Task Agent: Live</div>
          <div className="rounded-lg border border-border/60 p-3 text-sm">Evaluation Agent: Gemini-backed</div>
        </CardContent>
      </Card>
    </div>
  );
}

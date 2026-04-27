"use client";

import { useMemo } from "react";
import { StatusBadge } from "@/components/custom/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardSnapshot } from "@/lib/types";

interface AdminDashboardProps {
  snapshot: DashboardSnapshot;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function AdminDashboard({ snapshot }: AdminDashboardProps) {
  const stats = useMemo(() => {
    const employees = snapshot.users.filter((user) => user.role === "EMPLOYEE").length;
    const managers = snapshot.users.filter((user) => user.role === "MANAGER").length;
    const admins = snapshot.users.filter((user) => user.role === "ADMIN").length;
    const attendanceToday = snapshot.attendances.filter((attendance) => isToday(attendance.createdAt)).length;
    const activeTasks = snapshot.tasks.filter((task) => task.status !== "DONE").length;
    const pendingTimesheets = snapshot.timesheets.filter((timesheet) => timesheet.status === "PENDING").length;

    return {
      employees,
      managers,
      admins,
      attendanceToday,
      activeTasks,
      pendingTimesheets,
    };
  }, [snapshot]);

  const latestApprovals = snapshot.approvals.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
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
            <CardTitle>Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.activeTasks}</p>
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              Full user list with role assignments and onboarding timestamp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Signals</CardTitle>
            <CardDescription>
              Real-time operational indicators for the demo environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
              Attendance logs today: <span className="font-semibold">{stats.attendanceToday}</span>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
              Total tasks tracked: <span className="font-semibold">{snapshot.tasks.length}</span>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
              Total approvals recorded: <span className="font-semibold">{snapshot.approvals.length}</span>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Latest approvals
              </p>
              <div className="space-y-2">
                {latestApprovals.length === 0 ? (
                  <p className="text-muted-foreground">No approvals recorded yet.</p>
                ) : (
                  latestApprovals.map((approval) => (
                    <div key={approval.id} className="rounded-md border border-border/60 px-2 py-1.5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{approval.managerName}</span>
                        <StatusBadge status={approval.decision} />
                      </div>
                      <p className="text-muted-foreground">{approval.feedback}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

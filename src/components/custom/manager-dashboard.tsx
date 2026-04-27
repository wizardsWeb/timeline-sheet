"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTaskAction, reviewTimesheetAction } from "@/app/actions";
import { StatusBadge } from "@/components/custom/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/lib/store";
import type { DashboardSnapshot } from "@/lib/types";

interface ManagerDashboardProps {
  snapshot: DashboardSnapshot;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function isInCurrentWeek(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return date >= sevenDaysAgo && date <= now;
}

export function ManagerDashboard({ snapshot }: ManagerDashboardProps) {
  const router = useRouter();
  const { currentUserId, triggerRefresh } = useUserStore();
  const [reviewingTimesheetId, setReviewingTimesheetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [isMutating, startMutation] = useTransition();

  const managers = useMemo(
    () => snapshot.users.filter((user) => user.role === "MANAGER"),
    [snapshot.users]
  );
  const employees = useMemo(
    () => snapshot.users.filter((user) => user.role === "EMPLOYEE"),
    [snapshot.users]
  );

  const activeManager =
    managers.find((manager) => manager.id === currentUserId) ?? managers[0] ?? null;

  const pendingTimesheets = useMemo(
    () => snapshot.timesheets.filter((timesheet) => timesheet.status === "PENDING"),
    [snapshot.timesheets]
  );

  const selectedTimesheet =
    pendingTimesheets.find((timesheet) => timesheet.id === reviewingTimesheetId) ?? null;

  const approvedThisWeek = snapshot.approvals.filter(
    (approval) => approval.decision === "APPROVED" && isInCurrentWeek(approval.createdAt)
  ).length;

  const rejectedThisWeek = snapshot.approvals.filter(
    (approval) => approval.decision === "REJECTED" && isInCurrentWeek(approval.createdAt)
  ).length;

  const teamHours = snapshot.timesheets
    .filter((timesheet) => employees.some((employee) => employee.id === timesheet.userId))
    .reduce((sum, timesheet) => sum + timesheet.hours, 0);

  const teamOverview = useMemo(
    () =>
      employees.map((employee) => {
        const employeeTasks = snapshot.tasks.filter((task) => task.assignedTo === employee.id);
        const employeeTimesheets = snapshot.timesheets.filter(
          (timesheet) => timesheet.userId === employee.id
        );

        return {
          id: employee.id,
          name: employee.name,
          openTasks: employeeTasks.filter((task) => task.status !== "DONE").length,
          completedTasks: employeeTasks.filter((task) => task.status === "DONE").length,
          loggedHours: employeeTimesheets.reduce((sum, entry) => sum + entry.hours, 0),
          pendingTimesheets: employeeTimesheets.filter((entry) => entry.status === "PENDING").length,
        };
      }),
    [employees, snapshot.tasks, snapshot.timesheets]
  );

  const handleCreateTask = () => {
    if (!taskAssigneeId) {
      toast.error("Select an employee before creating a task");
      return;
    }

    startMutation(async () => {
      const result = await createTaskAction({
        title: taskTitle,
        description: taskDescription,
        assignedTo: taskAssigneeId,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setTaskTitle("");
      setTaskDescription("");
      setTaskAssigneeId("");
      toast.success(result.message);
      triggerRefresh();
      router.refresh();
    });
  };

  const handleDecision = (decision: "APPROVED" | "REJECTED") => {
    if (!activeManager || !selectedTimesheet) {
      return;
    }

    startMutation(async () => {
      const result = await reviewTimesheetAction({
        timesheetId: selectedTimesheet.id,
        managerId: activeManager.id,
        decision,
        feedback,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setReviewingTimesheetId(null);
      setFeedback("");
      toast.success(result.message);
      triggerRefresh();
      router.refresh();
    });
  };

  if (!activeManager) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No manager found</CardTitle>
          <CardDescription>
            Seed manager data to unlock approval workflows.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{employees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pendingTimesheets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approved (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{approvedThisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{teamHours.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>
              Current delivery load, time logging volume, and pending manager actions by employee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Open Tasks</TableHead>
                  <TableHead>Completed Tasks</TableHead>
                  <TableHead>Logged Hours</TableHead>
                  <TableHead>Pending Logs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamOverview.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.openTasks}</TableCell>
                    <TableCell>{member.completedTasks}</TableCell>
                    <TableCell>{member.loggedHours.toFixed(1)}</TableCell>
                    <TableCell>{member.pendingTimesheets}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pending Timesheet Approvals</CardTitle>
            <CardDescription>
              Review logs, add contextual feedback, and approve or reject.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTimesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No pending approvals.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingTimesheets.map((timesheet) => (
                    <TableRow key={timesheet.id}>
                      <TableCell>{timesheet.userName}</TableCell>
                      <TableCell>{timesheet.taskTitle}</TableCell>
                      <TableCell>{timesheet.hours.toFixed(1)}</TableCell>
                      <TableCell>
                        <StatusBadge status={timesheet.status} />
                      </TableCell>
                      <TableCell>{formatDate(timesheet.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewingTimesheetId(timesheet.id)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Task</CardTitle>
            <CardDescription>
              Create and assign new tasks directly from manager workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Task title</Label>
              <Input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Example: Sprint Planning Prep"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="Define expected outcome and scope"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateTask} disabled={isMutating} className="w-full">
              Create Task
            </Button>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
              Rejected this week: <span className="font-medium text-foreground">{rejectedThisWeek}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selectedTimesheet)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingTimesheetId(null);
            setFeedback("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Timesheet</DialogTitle>
            <DialogDescription>
              {selectedTimesheet
                ? `${selectedTimesheet.userName} logged ${selectedTimesheet.hours.toFixed(1)}h for ${selectedTimesheet.taskTitle}.`
                : "Select a timesheet to review."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Manager feedback</Label>
            <Textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Provide clear feedback for the employee"
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => handleDecision("REJECTED")}
              disabled={isMutating || !selectedTimesheet}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleDecision("APPROVED")}
              disabled={isMutating || !selectedTimesheet}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

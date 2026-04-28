"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  checkInAction,
  checkOutAction,
  createTimesheetAction,
  deleteTimesheetAction,
  generateEvaluationAction,
  updateTimesheetAction,
  updateTaskStatusAction,
} from "@/app/actions";
import { StatusBadge } from "@/components/custom/status-badge";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/lib/store";
import type { DashboardSnapshot, EvaluationResult, TaskStatus } from "@/lib/types";

interface EmployeeDashboardProps {
  snapshot: DashboardSnapshot;
}

interface TimesheetFormState {
  taskId: string;
  description: string;
  hours: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function calculateWorkedHours(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  return Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
}

export function EmployeeDashboard({ snapshot }: EmployeeDashboardProps) {
  const router = useRouter();
  const { currentUserId, triggerRefresh } = useUserStore();
  const [timesheetDialogOpen, setTimesheetDialogOpen] = useState(false);
  const [formState, setFormState] = useState<TimesheetFormState>({
    taskId: "",
    description: "",
    hours: "",
  });
  const [evaluationMap, setEvaluationMap] = useState<Record<string, EvaluationResult>>({});
  const [taskStatusDrafts, setTaskStatusDrafts] = useState<Record<string, TaskStatus>>({});
  const [editingTimesheet, setEditingTimesheet] = useState<{ id: string; description: string; hours: string } | null>(null);
  const [isMutating, startMutation] = useTransition();
  const [isEvaluating, startEvaluation] = useTransition();

  const employees = useMemo(
    () => snapshot.users.filter((user) => user.role === "EMPLOYEE"),
    [snapshot.users]
  );

  const activeEmployee =
    employees.find((employee) => employee.id === currentUserId) ?? employees[0] ?? null;

  const userAttendances = useMemo(
    () =>
      snapshot.attendances
        .filter((attendance) => attendance.userId === activeEmployee?.id)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [activeEmployee?.id, snapshot.attendances]
  );

  const userTasks = useMemo(
    () => snapshot.tasks.filter((task) => task.assignedTo === activeEmployee?.id),
    [activeEmployee?.id, snapshot.tasks]
  );

  const userTimesheets = useMemo(
    () => snapshot.timesheets.filter((timesheet) => timesheet.userId === activeEmployee?.id),
    [activeEmployee?.id, snapshot.timesheets]
  );

  const userApprovals = useMemo(() => {
    const userTimesheetIds = new Set(userTimesheets.map((timesheet) => timesheet.id));
    return snapshot.approvals.filter((approval) => userTimesheetIds.has(approval.timesheetId));
  }, [snapshot.approvals, userTimesheets]);

  const todayAttendance = userAttendances.find((attendance) => isToday(attendance.createdAt));
  const todayHours = calculateWorkedHours(todayAttendance?.checkIn ?? null, todayAttendance?.checkOut ?? null);
  const completedTaskCount = userTasks.filter((task) => task.status === "DONE").length;

  const weeklyHours = userAttendances
    .slice(0, 7)
    .reduce((sum, attendance) => sum + calculateWorkedHours(attendance.checkIn, attendance.checkOut), 0);

  const activeEvaluation = activeEmployee ? evaluationMap[activeEmployee.id] : undefined;

  const runAction = (action: () => Promise<void>) => {
    startMutation(async () => {
      await action();
      triggerRefresh();
      router.refresh();
    });
  };

  const handleCheckIn = () => {
    if (!activeEmployee) {
      return;
    }

    runAction(async () => {
      const result = await checkInAction(activeEmployee.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  };

  const handleCheckOut = () => {
    if (!activeEmployee) {
      return;
    }

    runAction(async () => {
      const result = await checkOutAction(activeEmployee.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  };

  const handleCreateTimesheet = () => {
    if (!activeEmployee) {
      return;
    }

    const hours = Number(formState.hours);

    runAction(async () => {
      const result = await createTimesheetAction({
        userId: activeEmployee.id,
        taskId: formState.taskId,
        description: formState.description,
        hours,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setTimesheetDialogOpen(false);
      setFormState({ taskId: "", description: "", hours: "" });
    });
  };

  const handleTaskStatusUpdate = (taskId: string) => {
    const nextStatus = taskStatusDrafts[taskId];
    if (!nextStatus) {
      toast.info("Select a status before updating");
      return;
    }

    runAction(async () => {
      const result = await updateTaskStatusAction({ taskId, status: nextStatus });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setTaskStatusDrafts((prev) => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });
    });
  };

  const handleDeleteTimesheet = (timesheetId: string) => {
    runAction(async () => {
      const result = await deleteTimesheetAction(timesheetId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  };

  const handleEditTimesheet = () => {
    if (!editingTimesheet) {
      return;
    }

    const hours = Number(editingTimesheet.hours);

    runAction(async () => {
      const result = await updateTimesheetAction({
        timesheetId: editingTimesheet.id,
        description: editingTimesheet.description,
        hours,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setEditingTimesheet(null);
    });
  };

  const handleGenerateEvaluation = () => {
    if (!activeEmployee) {
      return;
    }

    const employeeId = activeEmployee.id;

    startEvaluation(async () => {
      const result = await generateEvaluationAction(employeeId);
      if (!result.ok || !result.data) {
        toast.error(result.message);
        return;
      }

      const evaluation = result.data;

      setEvaluationMap((prev) => ({
        ...prev,
        [employeeId]: evaluation,
      }));
      toast.success("AI evaluation generated");
    });
  };

  if (!activeEmployee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No employee data found</CardTitle>
          <CardDescription>
            Seed your database to start exploring employee workflows.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Check in/out and track your daily hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
              <span className="text-sm text-muted-foreground">Today</span>
              <Badge variant="secondary">{todayHours.toFixed(2)} hrs</Badge>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p>Check-in: {todayAttendance?.checkIn ? formatDate(todayAttendance.checkIn) : "Not checked in"}</p>
              <p>
                Check-out: {todayAttendance?.checkOut ? formatDate(todayAttendance.checkOut) : "Not checked out"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCheckIn}
                disabled={isMutating || !!todayAttendance}
                className="flex-1"
              >
                Check In
              </Button>
              <Button
                variant="outline"
                onClick={handleCheckOut}
                disabled={isMutating || !todayAttendance || !!todayAttendance.checkOut}
                className="flex-1"
              >
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Snapshot</CardTitle>
            <CardDescription>Quick productivity indicators for this week.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-muted-foreground">Weekly attendance hours</span>
              <span className="font-semibold">{weeklyHours.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-muted-foreground">Tasks completed</span>
              <span className="font-semibold">
                {completedTaskCount}/{userTasks.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-muted-foreground">Timesheets logged</span>
              <span className="font-semibold">{userTimesheets.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Evaluation</CardTitle>
            <CardDescription>
              LLM-based appraisal generated from attendance, tasks, and timesheets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeEvaluation ? (
              <>
                <div className="rounded-xl border bg-muted/20 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Score</p>
                  <p className="text-4xl font-semibold">{activeEvaluation.score}</p>
                </div>
                <p className="text-sm text-muted-foreground">{activeEvaluation.summary}</p>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Strengths
                  </p>
                  <ul className="space-y-1 text-sm">
                    {activeEvaluation.strengths.map((item) => (
                      <li key={item} className="rounded-md border border-border/60 px-2 py-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Improvements
                  </p>
                  <ul className="space-y-1 text-sm">
                    {activeEvaluation.improvements.map((item) => (
                      <li key={item} className="rounded-md border border-border/60 px-2 py-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Appraisal
                  </p>
                  <p className="text-sm text-muted-foreground">{activeEvaluation.appraisal}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate an AI summary to see score, strengths, improvements, and appraisal.
              </p>
            )}
            <Button onClick={handleGenerateEvaluation} disabled={isEvaluating} className="w-full">
              {isEvaluating ? "Generating..." : "Run AI Evaluation"}
            </Button>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Manager feedback
              </p>
              <div className="space-y-2">
                {userApprovals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No manager reviews have been recorded for your timesheets yet.
                  </p>
                ) : (
                  userApprovals.slice(0, 3).map((approval) => (
                    <div key={approval.id} className="rounded-md border border-border/60 px-3 py-2 text-sm">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <StatusBadge status={approval.decision} />
                        <span className="text-xs text-muted-foreground">{formatDate(approval.createdAt)}</span>
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

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Execution Workspace</CardTitle>
            <CardDescription>
              Track daily logs and keep tasks updated in one place.
            </CardDescription>
          </div>
          <Dialog open={timesheetDialogOpen} onOpenChange={setTimesheetDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Timesheet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Timesheet Entry</DialogTitle>
                <DialogDescription>
                  Log your work against an assigned task for manager review.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Task</Label>
                  <Select
                    value={formState.taskId}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, taskId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {userTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe work completed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hours</Label>
                  <Input
                    type="number"
                    min={0.5}
                    max={24}
                    step={0.5}
                    value={formState.hours}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, hours: event.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateTimesheet}
                  disabled={isMutating || userTasks.length === 0}
                >
                  Submit for Review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timesheets">
            <TabsList>
              <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>

            <TabsContent value="timesheets" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userTimesheets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No timesheets yet. Add your first work log.
                      </TableCell>
                    </TableRow>
                  ) : (
                    userTimesheets.map((timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell>{formatDate(timesheet.createdAt)}</TableCell>
                        <TableCell>{timesheet.taskTitle}</TableCell>
                        <TableCell className="max-w-sm truncate">{timesheet.description}</TableCell>
                        <TableCell>{timesheet.hours.toFixed(1)}</TableCell>
                        <TableCell>
                          <StatusBadge status={timesheet.status} />
                        </TableCell>
                        <TableCell>
                          {timesheet.status === "PENDING" && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isMutating}
                                onClick={() =>
                                  setEditingTimesheet({
                                    id: timesheet.id,
                                    description: timesheet.description,
                                    hours: String(timesheet.hours),
                                  })
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isMutating}
                                onClick={() => handleDeleteTimesheet(timesheet.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Edit Timesheet Dialog */}
              <Dialog
                open={Boolean(editingTimesheet)}
                onOpenChange={(open) => {
                  if (!open) setEditingTimesheet(null);
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Timesheet Entry</DialogTitle>
                    <DialogDescription>
                      Update the description or hours for this pending work log.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea
                        value={editingTimesheet?.description ?? ""}
                        onChange={(event) =>
                          setEditingTimesheet((prev) =>
                            prev ? { ...prev, description: event.target.value } : prev
                          )
                        }
                        placeholder="Describe work completed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hours</Label>
                      <Input
                        type="number"
                        min={0.5}
                        max={24}
                        step={0.5}
                        value={editingTimesheet?.hours ?? ""}
                        onChange={(event) =>
                          setEditingTimesheet((prev) =>
                            prev ? { ...prev, hours: event.target.value } : prev
                          )
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEditingTimesheet(null)}
                      disabled={isMutating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleEditTimesheet} disabled={isMutating}>
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No assigned tasks yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    userTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell className="max-w-sm truncate">{task.description}</TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={taskStatusDrafts[task.id] ?? task.status}
                              onValueChange={(value) =>
                                setTaskStatusDrafts((prev) => ({
                                  ...prev,
                                  [task.id]: value as TaskStatus,
                                }))
                              }
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TODO">TODO</SelectItem>
                                <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                                <SelectItem value="DONE">DONE</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isMutating}
                              onClick={() => handleTaskStatusUpdate(task.id)}
                            >
                              Save
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAttendances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No attendance records yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    userAttendances.map((attendance) => (
                      <TableRow key={attendance.id}>
                        <TableCell>{formatDate(attendance.createdAt)}</TableCell>
                        <TableCell>
                          {attendance.checkIn ? formatDate(attendance.checkIn) : "Not recorded"}
                        </TableCell>
                        <TableCell>
                          {attendance.checkOut ? formatDate(attendance.checkOut) : "Active session"}
                        </TableCell>
                        <TableCell>
                          {calculateWorkedHours(attendance.checkIn, attendance.checkOut).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

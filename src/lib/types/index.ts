export interface EvaluationResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  appraisal: string;
}

export type RoleType = "EMPLOYEE" | "MANAGER" | "ADMIN";
export type TimesheetStatus = "PENDING" | "APPROVED" | "REJECTED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type ApprovalDecision = "APPROVED" | "REJECTED";

export interface AttendanceRecord {
  id: string;
  userId: string;
  checkIn: Date | null;
  checkOut: Date | null;
  createdAt: Date;
}

export interface TimesheetRecord {
  id: string;
  userId: string;
  taskId: string;
  description: string;
  hours: number;
  status: string;
  createdAt: Date;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: string;
  createdAt: Date;
}

export interface ApprovalRecord {
  id: string;
  timesheetId: string;
  managerId: string;
  feedback: string;
  decision: string;
  createdAt: Date;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  createdAt: string;
}

export interface DashboardAttendance {
  id: string;
  userId: string;
  checkIn: string | null;
  checkOut: string | null;
  createdAt: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  status: TaskStatus;
  createdAt: string;
}

export interface DashboardTimesheet {
  id: string;
  userId: string;
  userName: string;
  taskId: string;
  taskTitle: string;
  description: string;
  hours: number;
  status: TimesheetStatus;
  createdAt: string;
}

export interface DashboardApproval {
  id: string;
  timesheetId: string;
  managerId: string;
  managerName: string;
  decision: ApprovalDecision;
  feedback: string;
  createdAt: string;
}

export interface DashboardSnapshot {
  users: DashboardUser[];
  attendances: DashboardAttendance[];
  tasks: DashboardTask[];
  timesheets: DashboardTimesheet[];
  approvals: DashboardApproval[];
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

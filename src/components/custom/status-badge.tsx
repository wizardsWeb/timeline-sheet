import { Badge } from "@/components/ui/badge";
import type { ApprovalDecision, TaskStatus, TimesheetStatus } from "@/lib/types";

type SupportedStatus = TaskStatus | TimesheetStatus | ApprovalDecision;

interface StatusBadgeProps {
  status: SupportedStatus;
}

const variantMap: Record<SupportedStatus, "default" | "secondary" | "outline" | "destructive"> = {
  TODO: "outline",
  IN_PROGRESS: "secondary",
  DONE: "default",
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={variantMap[status]}>{status.replaceAll("_", " ")}</Badge>;
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/lib/store";
import type { DashboardUser, RoleType } from "@/lib/types";

interface MockLoginPanelProps {
  users: DashboardUser[];
}

const roles: RoleType[] = ["EMPLOYEE", "MANAGER", "ADMIN"];

export function MockLoginPanel({ users }: MockLoginPanelProps) {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [role, setRole] = useState<RoleType>("EMPLOYEE");
  const [selectedUserId, setSelectedUserId] = useState("");

  if (users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f8fafc_0%,#f1f5f9_45%,#e2e8f0_100%)] p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>No users available</CardTitle>
            <CardDescription>
              Run the seed script to create demo users and start the prototype.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const usersByRole = useMemo(
    () => users.filter((user) => user.role === role),
    [role, users]
  );

  const selectedUser = usersByRole.find((user) => user.id === selectedUserId) ?? usersByRole[0] ?? null;

  const handleRoleChange = (nextRole: RoleType) => {
    setRole(nextRole);
    const nextUsers = users.filter((user) => user.role === nextRole);
    setSelectedUserId(nextUsers[0]?.id ?? "");
  };

  const handleContinue = () => {
    if (!selectedUser) {
      return;
    }

    setUser(selectedUser.id, selectedUser.name, selectedUser.role);
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#f8fafc_0%,#f1f5f9_45%,#e2e8f0_100%)] p-4">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Workforce Management Prototype</CardTitle>
          <CardDescription>
            Mock sign-in for role simulation. Choose a role and user profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => handleRoleChange(value as RoleType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>User</Label>
            <Select
              value={selectedUser?.id ?? ""}
              onValueChange={(value) => setSelectedUserId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {usersByRole.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={handleContinue} disabled={!selectedUser}>
            Enter Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

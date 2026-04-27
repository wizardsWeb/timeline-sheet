"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RoleType } from "@/lib/types";

interface UserState {
  currentUserId: string;
  currentUserName: string;
  currentRole: RoleType;
  refreshKey: number;
  setUser: (id: string, name: string, role: RoleType) => void;
  setRole: (role: RoleType) => void;
  resetUser: () => void;
  triggerRefresh: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUserId: "",
      currentUserName: "",
      currentRole: "EMPLOYEE",
      refreshKey: 0,
      setUser: (id, name, role) =>
        set({ currentUserId: id, currentUserName: name, currentRole: role }),
      setRole: (role) => set({ currentRole: role }),
      resetUser: () =>
        set({
          currentUserId: "",
          currentUserName: "",
          currentRole: "EMPLOYEE",
        }),
      triggerRefresh: () =>
        set((state) => ({ refreshKey: state.refreshKey + 1 })),
    }),
    {
      name: "workforce-user-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        currentUserName: state.currentUserName,
        currentRole: state.currentRole,
      }),
    }
  )
);

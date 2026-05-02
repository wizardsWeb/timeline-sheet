# Phase 1 — Auth, AppShell, Design System

**Status:** Approved (2026-05-03)
**Phase:** 1 of 5 (MVP rebuild)

## Goal

Replace the current single-page "Workforce Control Center" with a multi-route, role-aware product shell. Phase 1 delivers the foundation every later phase builds on:

1. Real signup/login with hashed passwords and JWT-cookie sessions.
2. A clean light-theme design system inspired by the Doozy reference.
3. A collapsible sidebar AppShell with role-filtered navigation.
4. Role-guarded routes for `/overview`, `/employee/*`, `/manager/*`, `/admin/*`.
5. Schema additions for passwords and Projects (Spaces).

Phase 1 ships **stubs** for non-overview pages (Tasks, Timesheet, Calendar, Members, Approvals, Users, etc.). Real content lands in Phases 2–4.

## Out of Scope

- Functional Tasks / Timesheet / Calendar / Members / Approvals UIs (Phases 2–4).
- Dark mode (deferred).
- Password reset, email verification, OAuth.
- AI evaluation rework, chat redesign.

---

## 1. Architecture

Next.js 15 App Router with two route groups:

- `src/app/(auth)/` — public. `/login`, `/signup`. No shell.
- `src/app/(app)/` — authenticated. `<AppShell>` layout. Routes:
  - `/overview` (all roles, role-aware content)
  - `/employee/tasks`, `/employee/timesheet`, `/employee/calendar`, `/employee/members`, `/employee/chat`
  - `/manager/approvals`, `/manager/timesheets`, `/manager/tasks`, `/manager/reports`
  - `/admin/users`, `/admin/timesheets`, `/admin/tasks`, `/admin/system`
  - `/projects/[id]` — single project view (stub)
  - `/settings`

Root `src/app/page.tsx` server-redirects: no session → `/login`, has session → `/overview`.

`middleware.ts` protects `(app)` routes by checking the `session` cookie; on failure redirects to `/login?next=<path>`. Role enforcement is layered in role-specific layouts (`/manager/layout.tsx`, `/admin/layout.tsx`) calling `requireRole(...)`.

---

## 2. Auth

### Schema change

Add to `User`:

```prisma
passwordHash String
```

### Library — `src/lib/auth.ts`

- `hashPassword(pw: string): Promise<string>` — `bcryptjs` (pure JS so it works in node runtime).
- `verifyPassword(pw, hash): Promise<boolean>`.
- `signSession({ userId, role }): Promise<string>` — `jose` HS256, 7-day expiry, secret from `AUTH_SECRET`.
- `verifySession(token): Promise<{ userId, role } | null>`.
- `getSession(): Promise<SessionUser | null>` — server-only. Reads `session` cookie via `next/headers`, verifies, hydrates user from DB. Wrapped in React `cache()` for per-request memoization.
- `requireSession()` — throws `redirect('/login')` if absent.
- `requireRole(...roles: Role[])` — throws `redirect('/overview')` if role mismatch.

`SessionUser = { id, name, email, role }`.

### Server actions — `src/app/(auth)/actions.ts`

- `signupAction(formData)` — zod validates `{ name, email, password (≥8), role ∈ {EMPLOYEE, MANAGER} }`. Rejects if email exists. Creates user, signs session, sets cookie, redirects `/overview`.
- `loginAction(formData)` — zod validates `{ email, password }`. Looks up user, verifies hash, sets cookie, redirects to `next` query param or `/overview`.
- `logoutAction()` — clears cookie, redirects `/login`.

Forms post via React 19 `useActionState`, returning `{ error?: string }` for inline display.

### Cookie

Name: `session`. Flags: `httpOnly`, `sameSite=lax`, `secure` in production, `path=/`, `maxAge=7d`.

### Middleware

`src/middleware.ts` runs on `(app)` matcher. Decodes cookie via `verifySession`. On failure redirects to `/login?next=<original-path>`. Does not enforce role (layouts do).

### Auth pages

- `/login` and `/signup` share a centered card layout (max-w-md, white card on `--bg`). Logo at top. Heading, subheading, form, footer link to the other page. Inline error banner. Submit button uses `--primary`.
- Signup form: name, email, password, role select (Employee / Manager).
- Login form: email, password.

---

## 3. Schema additions

```prisma
model User {
  id           String  @id @default(cuid())
  name         String
  email        String  @unique
  passwordHash String
  role         Role    @default(EMPLOYEE)
  createdAt    DateTime @default(now())

  attendances   Attendance[]
  timesheets    Timesheet[]
  assignedTasks Task[]      @relation("AssignedTasks")
  approvals     Approval[]  @relation("ManagerApprovals")
  messages      Message[]
  projects      ProjectMember[]

  @@index([role])
}

model Project {
  id        String   @id @default(cuid())
  name      String
  color     String   @default("#16A34A")
  createdAt DateTime @default(now())

  members ProjectMember[]
  tasks   Task[]
}

model ProjectMember {
  projectId String
  userId    String
  role      String   @default("MEMBER") // OWNER | MEMBER

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
  @@index([userId])
}

model Task {
  // existing fields ...
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
}
```

### Seed (`prisma/seed.ts`)

- Admin: `admin@demo.com` / `admin123` (ADMIN).
- Managers: `manager@demo.com` / `manager123` (MANAGER).
- Employees: `alice@demo.com`, `bob@demo.com`, `carol@demo.com` — `employee123` (EMPLOYEE).
- Projects: "Doozy App" (green), "Marketing Site" (amber). Manager + 2 employees per project.
- Sample tasks tied to projects, sample timesheets in PENDING state, one approved, one rejected.

All passwords hashed via `hashPassword` at seed time.

---

## 4. Design system

### Tokens — `src/app/globals.css`

```css
:root {
  --bg: #F3F4F4;
  --surface: #FFFFFF;
  --surface-2: #F8F9FA;
  --border: #E5E7EB;
  --border-strong: #D1D5DB;
  --text: #0F1115;
  --text-muted: #6B7280;
  --text-subtle: #9CA3AF;
  --primary: #16A34A;
  --primary-hover: #15803D;
  --primary-fg: #FFFFFF;
  --primary-soft: #DCFCE7;
  --danger: #DC2626;
  --danger-soft: #FEE2E2;
  --warn: #F59E0B;
  --warn-soft: #FEF3C7;
  --info: #2563EB;
  --radius: 14px;
  --radius-sm: 10px;
  --radius-pill: 999px;
  --shadow-card: 0 1px 2px rgba(15,17,21,.04), 0 1px 1px rgba(15,17,21,.03);
}
```

Tailwind v4 `@theme inline` block maps tokens to Tailwind utilities (`bg-surface`, `text-muted`, `border-border`, `text-primary`, etc.).

### Typography

`Inter` via `next/font/google`, weights 400/500/600/700. Applied on `<html>` className.

Type scale:

- Page title — 24px / 700
- Section title — 16px / 600
- Body — 14px / 400
- Caption — 12px / 500
- Numeric (stat values) — 28px / 700

### Components

Re-theme existing shadcn primitives so they read tokens (`--primary`, `--surface`, etc.) instead of zinc/neutral defaults. New primitives in `src/components/ui/`:

- `<PageHeader title subtitle actions />` — used at top of every page.
- `<StatCard label value delta icon />` — Doozy-style stat tile with optional change indicator.
- `<EmptyState icon title description action />` — for stub pages.
- `<RoleBadge role />` — colored pill (Admin red-soft, Manager amber-soft, Employee green-soft).
- `<SectionCard title actions>` — white card with header row and content slot.

Icons: `lucide-react`.

---

## 5. AppShell

### Files

- `src/app/(app)/layout.tsx` — server component. `const session = await requireSession()`. Renders `<AppShell user={session}>{children}</AppShell>`.
- `src/components/app-shell/app-shell.tsx` — client. Composes `<Sidebar>` + `<TopBar>` + `<main>`.
- `src/components/app-shell/sidebar.tsx` — client.
- `src/components/app-shell/top-bar.tsx` — client.
- `src/lib/nav.ts` — pure config: nav items per role.
- `src/store/ui.ts` — zustand store: `{ sidebarCollapsed: boolean, toggleSidebar() }` persisted to `localStorage`.

### Sidebar

- Width 260px expanded, 64px collapsed. Smooth width transition.
- Top: logo square (rounded green) + workspace name "Timeline" + user email muted line. Email hides when collapsed.
- Nav section: items from `nav.ts` filtered by role. Each item is icon + label, active state = soft green pill, hover = `surface-2`. Collapsed shows icon-only with tooltip on hover.
- Divider, then "Space" header with `+` button (Phase 2). Lists user's projects (color dot + name).
- Promo card: "Smarter tasking with AI assist" — visible only when expanded.
- Bottom rail: Settings, Help & Center, Logout (red text). Logout posts `logoutAction`.
- Collapse toggle: chevron button at sidebar top-right corner.

### TopBar

- Height 64px, sticky, `bg-surface`, bottom border.
- Left: page title slot (rendered via `<PageHeader>` portal — actually pages render `<PageHeader>` inline at top of main area, top bar carries only utility controls). Decision: title lives in main content area, top bar carries search + utilities only. (Rationale: matches Doozy ref where title is in scroll area, not in top bar.)
- Right: search input (`Cmd+K` placeholder, opens nothing in Phase 1), bell icon (no popover Phase 1), user avatar dropdown — name, role badge, "Settings" link, "Logout" item.

### Nav config

```ts
type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label?: string; items: NavItem[] };
type RoleNav = NavGroup[];

const employeeNav: RoleNav = [/* Overview, Tasks, Timesheet, Calendar, Members, Team Chat */];
const managerNav: RoleNav = [/* Overview, Approvals, Team Timesheets, Tasks, Members, Reports, Team Chat */];
const adminNav: RoleNav = [/* Overview, Users, All Timesheets, All Tasks, System, Team Chat */];

export function navFor(role: Role): RoleNav { /* ... */ }
```

### Role guards

- `src/app/(app)/manager/layout.tsx` — `await requireRole('MANAGER', 'ADMIN')`.
- `src/app/(app)/admin/layout.tsx` — `await requireRole('ADMIN')`.

### Routes shipped Phase 1

| Route | Status |
|---|---|
| `/login`, `/signup` | functional |
| `/overview` | functional, role-aware stat cards (port simplified version of current dashboard) |
| `/employee/tasks`, `/timesheet`, `/calendar`, `/members`, `/chat` | EmptyState stubs |
| `/manager/approvals`, `/timesheets`, `/tasks`, `/reports` | EmptyState stubs |
| `/admin/users`, `/timesheets`, `/tasks`, `/system` | EmptyState stubs |
| `/projects/[id]` | EmptyState stub |
| `/settings` | EmptyState stub |

`/overview` content:
- All roles: 4 stat cards (role-tailored — employee: My Tasks Open, Hours This Week, Pending Timesheets, Tasks Done; manager: Pending Approvals, Team Hours, Active Tasks, Team Size; admin: Users, Employees, Managers, Pending Logs).
- Section card "Recent activity" — last 5 timesheets the user can see (own / team / all).
- Section card "Your projects" — chips listing projects.

---

## 6. File map (new + modified)

**New:**
- `src/lib/auth.ts`
- `src/lib/nav.ts`
- `src/lib/db.ts` (if not present — single PrismaClient)
- `src/store/ui.ts`
- `src/middleware.ts`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx` (replace existing)
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/actions.ts` (replace)
- `src/app/(app)/layout.tsx`
- `src/app/(app)/overview/page.tsx`
- `src/app/(app)/employee/{tasks,timesheet,calendar,members,chat}/page.tsx`
- `src/app/(app)/manager/{approvals,timesheets,tasks,reports}/page.tsx` + `layout.tsx`
- `src/app/(app)/admin/{users,timesheets,tasks,system}/page.tsx` + `layout.tsx`
- `src/app/(app)/projects/[id]/page.tsx`
- `src/app/(app)/settings/page.tsx`
- `src/components/app-shell/{app-shell,sidebar,top-bar}.tsx`
- `src/components/ui/{page-header,stat-card,empty-state,role-badge,section-card}.tsx`

**Modified:**
- `prisma/schema.prisma` — add `passwordHash`, `Project`, `ProjectMember`, `Task.projectId`.
- `prisma/seed.ts` — hash passwords, create projects.
- `src/app/globals.css` — replace tokens.
- `src/app/layout.tsx` — Inter font, body `bg-bg text-text`.
- `src/app/page.tsx` — redirect logic.
- `package.json` — add `bcryptjs`, `@types/bcryptjs`, `jose`, `zod`.

**Deleted:**
- `src/app/dashboard/page.tsx` (subsumed by `/overview`).
- `src/app/employee/page.tsx`, `src/app/manager/page.tsx`, `src/app/admin/page.tsx` (replaced by routed pages under `(app)`).
- `src/app/chat/page.tsx` (moves to `/employee/chat` stub Phase 1).

---

## 7. Environment

Add to `.env`:

```
AUTH_SECRET="<32+ char random>"
```

---

## 8. Acceptance criteria

- New user signs up → cookie set → lands on `/overview` matching their role's content.
- Existing user logs in → same flow.
- Manager visiting `/admin/users` redirected to `/overview`.
- Employee visiting `/manager/approvals` redirected to `/overview`.
- Refreshing any `(app)` page while logged out → `/login?next=…` and after login returns to that page.
- Sidebar collapse persists across reload.
- Logout clears cookie and returns to `/login`.
- Seed produces five demo accounts and two projects with hashed passwords.
- All stub pages render `<EmptyState>` with role-appropriate copy.
- `bun run typecheck` clean.

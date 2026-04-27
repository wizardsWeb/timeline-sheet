# Multi-Agent Workforce Management Prototype

A demo-level, production-structured workforce management system built with:

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + SQLite
- Zustand (mock auth + role/user context)
- Gemini API integration for AI-based employee evaluation
- Server Actions for core mutations

## Features

- Attendance agent with duplicate check-in prevention and checkout workflow
- Timesheet agent with validation and manager approval gates
- Task agent for creation, assignment, and status updates
- Evaluation agent that calls Gemini and parses strict JSON output safely
- Role-based UI workspaces:
  - Employee dashboard
  - Manager dashboard
  - Admin dashboard
- Mock login and role switching persisted in local state

## Project Structure

Core files:

- `src/lib/agents/*` - autonomous domain agents
- `src/lib/data/workforce.ts` - consolidated server-side dashboard snapshot
- `src/app/actions.ts` - server actions for attendance, task, timesheet, and AI flows
- `src/components/custom/*` - role dashboards + shell
- `prisma/schema.prisma` - database models and enums
- `prisma/seed.js` - demo data setup

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

3. Set your Gemini key in `.env`

```env
GEMINI_API_KEY=your_key_here
```

4. Initialize database and seed data

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start development server

```bash
npm run dev
```

Open http://localhost:3000 and you will be redirected to `/login`.

## Useful Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run typecheck` - TypeScript checks
- `npm run db:generate` - generate Prisma client
- `npm run db:push` - sync schema to SQLite
- `npm run db:seed` - seed demo records
- `npm run db:reset` - reset DB and reseed

## Demo Flow

1. Login via mock role selector.
2. Employee:
	- Check in / check out
	- Add timesheet entry
	- Update task status
	- Run AI evaluation
3. Manager:
	- Review pending timesheets
	- Approve/reject with feedback
	- Assign new tasks
4. Admin:
	- Monitor users and role distribution
	- View system-wide stats and latest approvals

## Notes

- If `GEMINI_API_KEY` is missing, invalid, or Gemini returns unreadable output, the evaluation agent shows a rules-based fallback appraisal so the demo remains usable.
- The app uses SQLite for demo simplicity (`DATABASE_URL="file:./dev.db"`).

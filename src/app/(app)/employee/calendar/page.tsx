import { Calendar as CalendarIcon } from "lucide-react";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { StatCard } from "@/components/timeline/stat-card";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ m?: string }>;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseMonth(raw: string | undefined): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function fmtMonth(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function shiftMonth({ year, month }: { year: number; month: number }, by: number) {
  const d = new Date(year, month + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireSession();
  const sp = await searchParams;
  const { year, month } = parseMonth(sp.m);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const entries = await prisma.timesheet.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    select: { hours: true, createdAt: true, status: true },
  });

  const dayMap = new Map<number, { hours: number; pending: number }>();
  for (const e of entries) {
    const d = e.createdAt.getDate();
    const cur = dayMap.get(d) ?? { hours: 0, pending: 0 };
    cur.hours += e.hours;
    if (e.status === "PENDING") cur.pending += e.hours;
    dayMap.set(d, cur);
  }

  const totalHours = entries.reduce((a, b) => a + b.hours, 0);
  const daysWithEntries = dayMap.size;
  const peakDay = [...dayMap.entries()].sort((a, b) => b[1].hours - a[1].hours)[0];
  const avgPerDay = daysWithEntries ? totalHours / daysWithEntries : 0;

  const firstDow = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: ({ day: number } | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const maxHours = Math.max(8, ...[...dayMap.values()].map((v) => v.hours));

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Time logged across the month at a glance."
        actions={
          <div className="flex items-center gap-1 rounded-[10px] border border-border bg-surface p-1">
            <a
              href={`/employee/calendar?m=${shiftMonth({ year, month }, -1)}`}
              className="rounded-[8px] px-2.5 py-1 text-xs font-medium hover:bg-secondary"
            >
              ← Prev
            </a>
            <span className="px-2 text-xs font-semibold">
              {fmtMonth(monthStart)}
            </span>
            <a
              href={`/employee/calendar?m=${shiftMonth({ year, month }, 1)}`}
              className="rounded-[8px] px-2.5 py-1 text-xs font-medium hover:bg-secondary"
            >
              Next →
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Hours"
          value={totalHours.toFixed(1)}
          icon={CalendarIcon}
        />
        <StatCard
          label="Active Days"
          value={`${daysWithEntries}`}
          delta={`Avg ${avgPerDay.toFixed(1)} h/day`}
          icon={CalendarIcon}
          iconBg="var(--info-soft)"
        />
        <StatCard
          label="Peak Day"
          value={peakDay ? `${peakDay[1].hours.toFixed(1)}h` : "—"}
          delta={
            peakDay
              ? `${monthStart.toLocaleString(undefined, { month: "short" })} ${peakDay[0]}`
              : "No entries yet"
          }
          icon={CalendarIcon}
          iconBg="var(--warn-soft)"
        />
      </div>

      <div className="mt-6">
        <SectionCard
          title={fmtMonth(monthStart)}
          description="Cell intensity reflects hours logged that day."
        >
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square" />;
              const data = dayMap.get(c.day);
              const intensity = data ? Math.min(1, data.hours / maxHours) : 0;
              const isToday =
                isCurrentMonth && today.getDate() === c.day;
              return (
                <div
                  key={i}
                  className="relative aspect-square rounded-[10px] border border-border p-2 text-left"
                  style={{
                    background: data
                      ? `color-mix(in srgb, var(--primary) ${20 + intensity * 60}%, var(--surface))`
                      : "var(--surface)",
                    color: intensity > 0.55 ? "white" : "inherit",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        "text-xs font-semibold " +
                        (isToday
                          ? "rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] h-5 w-5 inline-flex items-center justify-center"
                          : "")
                      }
                    >
                      {c.day}
                    </span>
                  </div>
                  {data ? (
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-bold leading-tight tabular-nums">
                        {data.hours.toFixed(1)}h
                      </p>
                      {data.pending > 0 ? (
                        <p
                          className="text-[10px] leading-tight"
                          style={{ opacity: 0.85 }}
                        >
                          {data.pending.toFixed(1)}h pending
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

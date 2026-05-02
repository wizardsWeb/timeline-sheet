"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Datum = { name: string; hours: number; open: number; done: number };

export function ReportsChart({ data }: { data: Datum[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 12,
            }}
            cursor={{ fill: "var(--secondary)" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="hours" name="Hours" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="open" name="Tasks open" fill="var(--warn)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="done" name="Tasks done" fill="var(--info)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

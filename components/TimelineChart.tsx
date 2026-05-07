"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyCountryStat } from "@/lib/types";

export function TimelineChart({ stats, title = "Timeline" }: { stats: DailyCountryStat[]; title?: string }) {
  const data = stats.map((stat) => ({
    date: stat.date,
    confirmed: stat.confirmed_total,
    suspected: stat.suspected_total,
    deaths: stat.deaths_total
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Timeline appears after the first dated report.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={data} margin={{ left: 0, right: 8, top: 10 }}>
                <defs>
                  <linearGradient id="confirmed" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="suspected" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
                <XAxis dataKey="date" minTickGap={24} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} width={36} />
                <Tooltip
                  contentStyle={{
                    background: "#0b1220",
                    border: "1px solid rgba(148, 163, 184, 0.25)",
                    borderRadius: 8,
                    color: "#e2e8f0"
                  }}
                />
                <Area dataKey="confirmed" fill="url(#confirmed)" stroke="#2dd4bf" strokeWidth={2} type="monotone" />
                <Area dataKey="suspected" fill="url(#suspected)" stroke="#f59e0b" strokeWidth={2} type="monotone" />
                <Area dataKey="deaths" fill="transparent" stroke="#f87171" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

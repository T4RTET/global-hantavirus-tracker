import { ExternalLink, RadioTower } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Report } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/utils";

const statusTone = {
  confirmed: "border-red-400/70 bg-red-700/30 text-red-50 shadow-[0_0_14px_rgba(239,68,68,0.28)]",
  suspected: "border-yellow-300/70 bg-yellow-500/20 text-yellow-100",
  death: "border-red-300/80 bg-red-950/70 text-red-100",
  monitoring: "border-yellow-500/50 bg-yellow-500/10 text-yellow-100/90",
  recovered: "border-lime-400/50 bg-lime-500/10 text-lime-100",
  official_update: "border-red-200/50 bg-red-950/40 text-red-100"
} as const;

const sourceTone = {
  official: "border-lime-400/50 bg-lime-500/10 text-lime-100",
  news: "border-red-300/40 bg-red-950/35 text-red-100",
  social: "border-sky-400/50 bg-sky-500/10 text-sky-100",
  manual: "border-zinc-500/40 bg-zinc-900/70 text-zinc-200"
} as const;

const confidenceTone = {
  high: "border-lime-400/50 bg-lime-500/10 text-lime-100",
  medium: "border-yellow-400/50 bg-yellow-500/10 text-yellow-100",
  low: "border-zinc-500/40 bg-zinc-900/70 text-zinc-200"
} as const;

function IntelPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]", className)}>
      {children}
    </span>
  );
}

export function ReportsFeed({ reports, title = "Recent updates" }: { reports: Report[]; title?: string }) {
  return (
    <Card className="bio-hud overflow-hidden border-red-950/80 bg-black/60">
      <CardHeader className="border-b border-red-950/70 bg-red-950/10">
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.24em] text-red-100">
          <RadioTower className="h-4 w-4 text-red-300" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-5">
        {reports.length === 0 ? (
          <div className="rounded border border-dashed border-red-900/70 bg-black/40 p-6 text-sm text-red-100/65">
            No reports match the current filters.
          </div>
        ) : (
          reports.map((report) => (
            <article
              className="group rounded border border-red-950/80 bg-[#070908]/85 p-4 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.04)] transition hover:border-red-700/80 hover:bg-red-950/10"
              key={report.id}
            >
              <div className="flex flex-wrap items-center gap-2 text-red-100">
                <IntelPill className={statusTone[report.status]}>{report.status.replace("_", " ")}</IntelPill>
                <IntelPill className={sourceTone[report.source_type]}>{report.source_type}</IntelPill>
                <IntelPill className={confidenceTone[report.confidence]}>{report.confidence}</IntelPill>
                <time className="ml-auto text-xs font-mono uppercase tracking-[0.12em] text-red-100/55">{formatDate(report.report_date)}</time>
              </div>
              <h3 className="mt-4 text-base font-black text-red-50">
                {report.country?.name ?? "Unknown country"}
                {report.location_name ? `, ${report.location_name}` : ""}
              </h3>
              <p className="mt-2 text-sm leading-6 text-red-100/72">{report.summary}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-red-100/62">
                <span>confirmed {formatNumber(report.case_count)}</span>
                <span>suspected {formatNumber(report.suspected_count)}</span>
                <span>deaths {formatNumber(report.death_count)}</span>
                <a
                  className="inline-flex items-center gap-1 text-red-200 underline-offset-4 hover:text-white hover:underline"
                  href={report.source_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {report.source_name} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

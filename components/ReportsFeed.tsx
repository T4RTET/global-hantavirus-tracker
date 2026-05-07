import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SourceBadge } from "@/components/SourceBadge";
import type { Report } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

const statusVariant = {
  confirmed: "success",
  suspected: "warning",
  death: "danger",
  monitoring: "secondary",
  recovered: "info",
  official_update: "info"
} as const;

export function ReportsFeed({ reports, title = "Recent updates" }: { reports: Report[]; title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No reports match the current filters.
          </div>
        ) : (
          reports.map((report) => (
            <article className="rounded-lg border bg-background/40 p-4" key={report.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant[report.status]}>{report.status.replace("_", " ")}</Badge>
                <SourceBadge confidence={report.confidence} sourceType={report.source_type} />
                <time className="ml-auto text-xs text-muted-foreground">{formatDate(report.report_date)}</time>
              </div>
              <h3 className="mt-3 font-medium">
                {report.country?.name ?? "Unknown country"}
                {report.location_name ? `, ${report.location_name}` : ""}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>confirmed {formatNumber(report.case_count)}</span>
                <span>suspected {formatNumber(report.suspected_count)}</span>
                <span>deaths {formatNumber(report.death_count)}</span>
                <a
                  className="inline-flex items-center gap-1 text-primary hover:underline"
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

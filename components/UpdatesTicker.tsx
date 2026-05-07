import type { Report } from "@/lib/types";

export function UpdatesTicker({ reports }: { reports: Report[] }) {
  const items = reports.slice(0, 8);
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y bg-card/40 py-3">
      <div className="flex w-max animate-ticker gap-8 whitespace-nowrap px-4 text-sm text-muted-foreground">
        {doubled.map((report, index) => (
          <span key={`${report.id}-${index}`}>
            <strong className="text-foreground">{report.country?.name ?? "Global"}</strong> {report.status.replace("_", " ")}:
            {" "}
            {report.summary}
          </span>
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { RadioTower } from "lucide-react";
import { ReportsFeed } from "@/components/ReportsFeed";
import { cn } from "@/lib/utils";
import { getReports } from "@/lib/data";
import type { ReportStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Latest hantavirus reports",
  description: "Filter recent source-linked hantavirus reports by confirmed, suspected, deaths, news, and official updates."
};

const statuses: Array<ReportStatus | "all"> = ["all", "confirmed", "suspected", "death", "monitoring", "official_update"];

export default async function LatestPage({ searchParams }: { searchParams: { status?: ReportStatus | "all" } }) {
  const status = statuses.includes(searchParams.status ?? "all") ? searchParams.status ?? "all" : "all";
  const reports = await getReports({ status, limit: 100 });

  return (
    <main className="bio-grid min-h-[calc(100vh-68px)] border-t border-red-950/60 bg-black/30 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded border border-red-800/70 bg-red-950/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-red-200">
              <RadioTower className="h-3.5 w-3.5" />
              Live intel
            </div>
            <h1 className="bio-text-glow text-4xl font-black uppercase tracking-[0.16em] text-red-50 md:text-5xl">
              Latest reports
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-red-100/75">
              Source-linked outbreak updates, monitoring records, and public health signals. Suspected and social reports stay separate from confirmed totals.
            </p>
          </div>
          <div className="rounded border border-red-900/70 bg-black/60 px-4 py-3 text-xs uppercase tracking-[0.28em] text-red-100/75">
            {reports.length} records scanned
          </div>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {statuses.map((item) => {
            const active = status === item;
            return (
              <Link
                className={cn(
                  "rounded border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition",
                  active
                    ? "border-red-400 bg-red-700 text-white shadow-[0_0_18px_rgba(239,68,68,0.42)]"
                    : "border-red-950/80 bg-black/55 text-red-100/65 hover:border-red-700 hover:text-red-100"
                )}
                href={item === "all" ? "/latest" : `/latest?status=${item}`}
                key={item}
              >
                {item.replace("_", " ")}
              </Link>
            );
          })}
        </div>
        <ReportsFeed reports={reports} title="All reports" />
      </div>
    </main>
  );
}

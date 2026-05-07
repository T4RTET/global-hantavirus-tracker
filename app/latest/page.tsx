import type { Metadata } from "next";
import Link from "next/link";
import { ReportsFeed } from "@/components/ReportsFeed";
import { Badge } from "@/components/ui/badge";
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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-normal">Latest reports</h1>
        <p className="mt-2 text-muted-foreground">All records retain source links and confidence labels.</p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Link href={item === "all" ? "/latest" : `/latest?status=${item}`} key={item}>
            <Badge variant={status === item ? "default" : "secondary"}>{item.replace("_", " ")}</Badge>
          </Link>
        ))}
      </div>
      <ReportsFeed reports={reports} title="All reports" />
    </main>
  );
}

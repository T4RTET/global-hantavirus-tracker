import { NextRequest, NextResponse } from "next/server";
import { getReports } from "@/lib/data";
import type { ReportStatus } from "@/lib/types";

const statuses = new Set(["confirmed", "suspected", "death", "monitoring", "recovered", "official_update"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Number(searchParams.get("limit") ?? 50);
  const country = searchParams.get("country") ?? undefined;

  const reports = await getReports({
    country,
    limit: Number.isFinite(limit) ? Math.min(limit, 200) : 50,
    status: status && statuses.has(status) ? (status as ReportStatus) : "all"
  });

  return NextResponse.json(reports, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=240" }
  });
}

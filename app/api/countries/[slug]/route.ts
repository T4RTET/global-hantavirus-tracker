import { NextResponse } from "next/server";
import { getCountryBySlug, getDailyStats, getReports } from "@/lib/data";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const country = await getCountryBySlug(params.slug);
  if (!country) return NextResponse.json({ error: "Country not found" }, { status: 404 });

  const [reports, timeline] = await Promise.all([
    getReports({ country: params.slug, limit: 50 }),
    getDailyStats(params.slug)
  ]);

  return NextResponse.json({ country, reports, timeline }, {
    headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" }
  });
}

import { NextResponse } from "next/server";
import { getCountryStats } from "@/lib/data";

export const revalidate = 120;

export async function GET() {
  return NextResponse.json(await getCountryStats(), {
    headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" }
  });
}

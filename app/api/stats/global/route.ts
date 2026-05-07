import { NextResponse } from "next/server";
import { getGlobalStats } from "@/lib/data";

export const revalidate = 60;

export async function GET() {
  return NextResponse.json(await getGlobalStats(), {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=240" }
  });
}

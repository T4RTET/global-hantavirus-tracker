import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingest";

export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}` || request.nextUrl.searchParams.get("secret") === secret;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runIngestion();
  return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

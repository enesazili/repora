import { NextResponse } from "next/server";
import { getPublicComparisonReports } from "@/lib/github/public-report";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("repos") || "";
  try {
    const reports = await getPublicComparisonReports(raw);
    return NextResponse.json({ reports }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=120" } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "upstream";
    const status = reason === "invalid" ? 400 : reason === "not_found" ? 404 : reason === "rate_limit" ? 429 : 502;
    return NextResponse.json({ error: status === 502 ? "upstream" : reason }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

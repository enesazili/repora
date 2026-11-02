import { NextResponse } from "next/server";
import { getPublicRepositoryReport } from "@/lib/github/public-report";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const report = await getPublicRepositoryReport(params.get("owner") || "", params.get("repo") || "");
    return NextResponse.json(report, { headers: { "Cache-Control": "public, max-age=0, s-maxage=120" } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "upstream";
    const status = reason === "invalid" ? 400 : reason === "not_found" ? 404 : reason === "rate_limit" ? 429 : 502;
    return NextResponse.json({ error: status === 502 ? "upstream" : reason }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

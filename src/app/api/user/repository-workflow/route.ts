import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { dbRepository } from "@/lib/db/client";
import { getRepositoryWorkflow, validRepositoryPath } from "@/lib/github/authenticated";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user || session.isDemo) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  const url = new URL(request.url);
  const owner = url.searchParams.get("owner") || "";
  const repo = url.searchParams.get("repo") || "";
  if (!validRepositoryPath(owner, repo)) return NextResponse.json({ error: "invalid" }, { status: 400, headers });
  try {
    const token = dbRepository.getGithubAccessToken(session.user.id);
    if (!token) return NextResponse.json({ error: "expired" }, { status: 401, headers });
    return NextResponse.json(await getRepositoryWorkflow(token, owner, repo), { headers });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "upstream";
    const status = reason === "expired" ? 401 : reason === "forbidden" ? 403 : reason === "not_found" ? 404 : 502;
    return NextResponse.json({ error: status === 502 ? "upstream" : reason }, { status, headers });
  }
}

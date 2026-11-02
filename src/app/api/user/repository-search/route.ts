import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { dbRepository } from "@/lib/db/client";
import { searchOwnedRepositories } from "@/lib/github/search";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user || session.isDemo) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
  const params = new URL(request.url).searchParams;
  const term = params.get("q") || "";
  const page = Number(params.get("page") || "1");
  const sort = params.get("sort") || "best-match";
  const scope = params.get("scope") || "owned";
  if (term.length < 2 || term.length > 80 || !Number.isInteger(page) || page < 1 || page > 34 || !["best-match", "stars", "forks", "updated"].includes(sort) || !["owned", "accessible-private"].includes(scope)) return NextResponse.json({ error: "invalid" }, { status: 400, headers });
  try {
    const token = dbRepository.getGithubAccessToken(session.user.id);
    if (!token) return NextResponse.json({ error: "expired" }, { status: 401, headers });
    return NextResponse.json(await searchOwnedRepositories(token, session.user.login, term, page, sort as "best-match" | "stars" | "forks" | "updated", scope as "owned" | "accessible-private"), { headers });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "upstream";
    const status = reason === "invalid" ? 400 : reason === "expired" ? 401 : reason === "rate_limit" ? 429 : 502;
    return NextResponse.json({ error: status === 502 ? "upstream" : reason }, { status, headers });
  }
}

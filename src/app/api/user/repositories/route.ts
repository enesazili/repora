import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { dbRepository } from "@/lib/db/client";
import { getAccountRepositories } from "@/lib/github/authenticated";

const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user || session.isDemo) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") || "1");
  const visibility = params.get("visibility") || "all";
  const affiliation = params.get("affiliation") || "owner";
  const sort = params.get("sort") || "updated";
  const direction = params.get("direction") || "desc";
  if (!Number.isInteger(page) || page < 1 || page > 20 || !["all", "public", "private"].includes(visibility) || !["owner", "collaborator", "organization_member", "all"].includes(affiliation) || !["updated", "pushed", "created", "full_name"].includes(sort) || !["asc", "desc"].includes(direction)) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: noStore });
  }
  try {
    const token = dbRepository.getGithubAccessToken(session.user.id);
    if (!token) return NextResponse.json({ error: "expired" }, { status: 401, headers: noStore });
    const repositories = await getAccountRepositories(token, { page, visibility: visibility as "all" | "public" | "private", affiliation: affiliation as "owner" | "collaborator" | "organization_member" | "all", sort: sort as "updated" | "pushed" | "created" | "full_name", direction: direction as "asc" | "desc" });
    return NextResponse.json({ repositories, hasMore: repositories.length === 100 && page < 20, page }, { headers: noStore });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "upstream";
    const status = reason === "expired" ? 401 : reason === "forbidden" ? 403 : 502;
    return NextResponse.json({ error: reason === "expired" || reason === "forbidden" ? reason : "upstream" }, { status, headers: noStore });
  }
}

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { dbRepository } from "@/lib/db/client";
import { isSameOrigin } from "@/lib/auth/origin";

export async function GET() {
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comparisons = dbRepository.getSavedComparisons(session.user.id);
  const formatted = comparisons.map((comp) => ({
    id: comp.id,
    title: comp.title,
    repo_names: JSON.parse(comp.repo_names || "[]"),
    created_at: comp.created_at,
  }));
  return NextResponse.json({ comparisons: formatted });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, repoNames } = await request.json();
    if (!title || !Array.isArray(repoNames) || repoNames.length === 0) {
      return NextResponse.json({ error: "Invalid comparison data" }, { status: 400 });
    }

    const id = dbRepository.saveComparison(session.user.id, String(title), repoNames.map(String));
    return NextResponse.json({ id, success: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    dbRepository.deleteComparison(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { dbRepository } from "@/lib/db/client";
import { isSameOrigin } from "@/lib/auth/origin";

export async function GET() {
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = dbRepository.getFavoriteRepositories(session.user.id);
  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = await getCurrentSession();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repoId, repoFullName } = await request.json();
    if (!repoId || !repoFullName) {
      return NextResponse.json({ error: "Invalid repository data" }, { status: 400 });
    }

    dbRepository.addFavoriteRepository(session.user.id, Number(repoId), String(repoFullName));
    return NextResponse.json({ success: true });
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
    const repoId = url.searchParams.get("repoId");
    if (!repoId) {
      return NextResponse.json({ error: "repoId is required" }, { status: 400 });
    }

    dbRepository.removeFavoriteRepository(session.user.id, Number(repoId));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

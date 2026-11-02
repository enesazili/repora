import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbRepository } from "@/lib/db/client";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/auth/origin";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    dbRepository.deleteSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}


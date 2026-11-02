import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { STATE_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/callback/github`;

  // Keep the login page actionable when local OAuth credentials are incomplete.
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET || !/^[a-f\d]{64}$/i.test(process.env.REPORA_TOKEN_ENCRYPTION_KEY || "")) {
    return NextResponse.redirect(new URL("/login?auth_error=oauth_not_configured", url.origin));
  }

  const state = crypto.randomBytes(24).toString("hex");
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("scope", "repo read:user");
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl.toString());
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}

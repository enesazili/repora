import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbRepository } from "@/lib/db/client";
import { SESSION_COOKIE_NAME, STATE_COOKIE_NAME } from "@/lib/auth/session";
import crypto from "node:crypto";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/login?auth_error=${encodeURIComponent(error)}`, url.origin));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE_NAME)?.value;

  if (!code || !state || !savedState || state.length !== savedState.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(savedState))) {
    return NextResponse.redirect(new URL("/login?auth_error=state_mismatch", url.origin));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?auth_error=oauth_not_configured", url.origin));
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Repora-App",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      return NextResponse.redirect(new URL("/login?auth_error=token_exchange_failed", url.origin));
    }

    const accessToken = tokenData.access_token;
    if (typeof accessToken !== "string" || !accessToken) {
      return NextResponse.redirect(new URL("/login?auth_error=token_exchange_failed", url.origin));
    }
    const scope = tokenData.scope || "";

    // 2. Fetch authenticated GitHub user
    const userRes = await fetch("https://api.github.com/user", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Repora-App",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/login?auth_error=user_fetch_failed", url.origin));
    }

    const ghUser = await userRes.json();

    // 3. Fetch primary email if needed
    let email = ghUser.email;
    if (!email) {
      try {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "Repora-App",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
        if (emailsRes.ok) {
          const emails: { email: string; primary: boolean }[] = await emailsRes.json();
          const primary = emails.find((e) => e.primary);
          email = primary ? primary.email : (emails[0]?.email || null);
        }
      } catch {}
    }

    // 4. Upsert user in database
    const user = dbRepository.upsertUser({
      github_id: ghUser.id,
      login: ghUser.login,
      name: ghUser.name,
      email,
      avatar_url: ghUser.avatar_url,
      bio: ghUser.bio,
    });

    // 5. Store account and access token
    dbRepository.upsertAccount({
      user_id: user.id,
      provider: "github",
      provider_account_id: String(ghUser.id),
      access_token: accessToken,
      scope,
    });

    // 6. Create session
    const session = dbRepository.createSession(user.id);

    // 7. Set cookie and redirect
    const response = NextResponse.redirect(new URL("/", url.origin));
    response.cookies.set(SESSION_COOKIE_NAME, session.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    response.cookies.delete(STATE_COOKIE_NAME);

    return response;
  } catch (err) {
    void err;
    return NextResponse.redirect(new URL("/login?auth_error=unexpected", url.origin));
  }
}

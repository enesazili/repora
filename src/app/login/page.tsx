"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@/providers/theme-provider";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/i18n";

export default function LoginPage() {
  const { authenticated, loading } = useAuth();
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("auth_error");
    if (reason) queueMicrotask(() => setError(reason));
    if (!loading && authenticated) window.location.replace("/");
  }, [loading, authenticated]);

  return <ThemeProvider><main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground">
    <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-10">
      <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Repora</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("loginTitle")}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{t("loginDescription")}</p></div>
      {error ? <p role="alert" className="rounded-md border border-danger bg-danger-muted p-3 text-sm text-danger">{error === "oauth_not_configured" ? t("oauthConfigHelp") : error === "state_mismatch" ? t("loginStateError") : t("authError")}</p> : null}
      {loading || authenticated ? <p role="status" className="text-sm text-muted-foreground">{t("loadingModule")}</p> : <a href="/api/auth/login" className="flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">{t("signInWithGithub")}</a>}
      <p className="text-xs leading-5 text-muted-foreground">{t("loginPrivacy")}</p>
    </div>
  </main></ThemeProvider>;
}

"use client";

import Image from "next/image";
import { ExternalLink, LogIn, LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useLocale } from "@/i18n";
import { useAuth } from "@/providers/auth-provider";

export function AccountSettings() {
  const { t } = useLocale();
  const { user, authenticated, isDemo, login, logout } = useAuth();

  return (
    <Panel id="account" className="scroll-mt-32 overflow-hidden xl:scroll-mt-24">
      <PanelHeader
        title={t("accountSettings")}
        description={t("accountConnected")}
        actions={
          <Badge
            variant={authenticated && !isDemo ? "accent" : "outline"}
            dot={authenticated}
          >
            {authenticated ? (isDemo ? t("demoAccount") : t("real")) : t("guest")}
          </Badge>
        }
      />

      <div className="border-t border-border p-4 sm:p-5">
        {authenticated && user ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="size-11 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-muted text-foreground ring-1 ring-border">
                  <User className="size-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.name || user.login}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{user.login}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {user.email || t("noPublicEmail")}
                </p>
                {user.bio ? (
                  <p className="mt-2 max-w-xl text-xs leading-5 text-muted-foreground">
                    {user.bio}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <a
                href={`https://github.com/${encodeURIComponent(user.login)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                {t("profileLink")}
              </a>
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
                className="gap-1.5 border-danger/30 text-danger hover:bg-danger-muted"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                {t("signOut")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("noConnectedAccount")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("guestDescription")}
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={login} className="gap-1.5">
              <LogIn className="size-3.5" aria-hidden="true" />
              {t("signInWithGithub")}
            </Button>
          </div>
        )}
      </div>

      {authenticated && user ? (
        <div className="border-t border-border bg-surface-secondary px-4 py-3 text-[10.5px] leading-4 text-muted-foreground sm:px-5">
          {t("accountPrivacyNote")}
        </div>
      ) : null}
    </Panel>
  );
}

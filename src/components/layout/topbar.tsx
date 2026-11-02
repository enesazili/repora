"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  FolderGit2,
  CalendarRange,
  Languages,
  Activity,
  TrendingUp,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Palette,
  Search,
  User,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { getPageTitle } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n";
import { useAuth } from "@/providers/auth-provider";

type PanelId = "search" | "notifications" | "profile";

interface TopbarProps {
  onOpenNav: () => void;
}

export function Topbar({ onOpenNav }: TopbarProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user, authenticated, isDemo, login, logout } = useAuth();
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<
    Partial<Record<PanelId, HTMLButtonElement | null>>
  >({});

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenPanel(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      const activePanel = openPanel;
      setOpenPanel(null);
      if (activePanel) {
        triggerRefs.current[activePanel]?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPanel]);

  function togglePanel(panel: PanelId) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  function closePanel() {
    setOpenPanel(null);
  }

  const title = pathname === "/settings" ? t("settings") : pathname.startsWith("/coming-soon/") ? t((getPageTitle(pathname).toLowerCase() as "repositories" | "contributions" | "languages" | "activity" | "insights")) : t("overview");

  return (
    <header className="app-topbar sticky top-0 z-30">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label={t("openNav")}
          className="-ml-1 grid size-9 shrink-0 place-items-center rounded-[8px] text-muted-foreground hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] lg:hidden"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            Repora
          </span>
          <ChevronRight
            className="hidden size-3 text-muted-foreground/60 sm:block"
            aria-hidden="true"
          />
          <span className="truncate text-[12.5px] font-medium text-foreground">
            {title}
          </span>
        </div>

        <div
          ref={containerRef}
          className="ml-auto flex items-center gap-1 sm:gap-1.5"
        >
          <div className="relative hidden md:block">
            <button
              ref={(node) => {
                triggerRefs.current.search = node;
              }}
              type="button"
              onClick={() => togglePanel("search")}
              aria-expanded={openPanel === "search"}
              aria-haspopup="dialog"
              aria-controls="topbar-search-panel"
              className="flex h-9 w-[250px] items-center gap-2 rounded-[8px] border border-border bg-surface-secondary px-2.5 text-left text-[11.5px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] xl:w-[290px]"
            >
              <Search className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{t("searchRepora")}</span>
            </button>

            {openPanel === "search" ? (
              <div
                id="topbar-search-panel"
                role="dialog"
                aria-label={t("searchPreview")}
                className="popover panel absolute top-[calc(100%+10px)] right-0 z-50 w-[320px] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold">{t("search")}</p>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                  {t("searchPrompt")}
                </p>
                <div className="mt-2.5 space-y-0.5">
                  <QuickLink
                    href="/"
                    icon={<LayoutDashboard className="size-3.5" />}
                    label={t("overview")}
                    onNavigate={closePanel}
                  />
                  <QuickLink
                    href="/repositories"
                    icon={<FolderGit2 className="size-3.5" />}
                    label={t("repositories")}
                    onNavigate={closePanel}
                  />
                  <QuickLink
                    href="/contributions"
                    icon={<CalendarRange className="size-3.5" />}
                    label={t("contributions")}
                    onNavigate={closePanel}
                  />
                  <QuickLink
                    href="/languages"
                    icon={<Languages className="size-3.5" />}
                    label={t("languages")}
                    onNavigate={closePanel}
                  />
                  <QuickLink
                    href="/activity"
                    icon={<Activity className="size-3.5" />}
                    label={t("activity")}
                    onNavigate={closePanel}
                  />
                  <QuickLink
                    href="/insights"
                    icon={<TrendingUp className="size-3.5" />}
                    label={t("insights")}
                    onNavigate={closePanel}
                  />
                  <QuickLink
                    href="/settings"
                    icon={<Palette className="size-3.5" />}
                    label={t("settings")}
                    onNavigate={closePanel}
                  />
                </div>
                <p className="mt-2.5 border-t border-border pt-2 text-[10px] text-muted-foreground">
                  {t("closeEsc")}
                </p>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              ref={(node) => {
                triggerRefs.current.notifications = node;
              }}
              type="button"
              onClick={() => togglePanel("notifications")}
              aria-expanded={openPanel === "notifications"}
              aria-haspopup="dialog"
              aria-controls="topbar-notifications-panel"
              aria-label={t("openNotifications")}
              className="relative grid size-9 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            >
              <Bell className="size-4" aria-hidden="true" />
            </button>

            {openPanel === "notifications" ? (
              <div
                id="topbar-notifications-panel"
                role="dialog"
                aria-label={t("notificationsPreview")}
                className="popover panel absolute top-[calc(100%+10px)] right-0 z-50 w-[310px] overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <p className="text-[12px] font-semibold">{t("notifications")}</p>
                </div>
                <p className="border-t border-border bg-surface-secondary px-3 py-2 text-[10px] leading-4 text-muted-foreground">
                  {t("notificationsLater")}
                </p>
              </div>
            ) : null}
          </div>

          <span
            aria-hidden="true"
            className="mx-1 hidden h-4 w-px bg-border sm:block"
          />

          <div className="relative">
            <button
              ref={(node) => {
                triggerRefs.current.profile = node;
              }}
              type="button"
              onClick={() => togglePanel("profile")}
              aria-expanded={openPanel === "profile"}
              aria-haspopup="dialog"
              aria-controls="topbar-profile-panel"
              className="flex items-center gap-2 rounded-[8px] p-0.5 pr-1 transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            >
              {authenticated && user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                  className="size-7 rounded-full border border-border object-cover"
                />
              ) : (
                <span className="grid size-7 place-items-center rounded-full bg-accent-muted text-[9.5px] font-semibold text-foreground ring-1 ring-border">
                  {authenticated && user ? user.login.slice(0, 2).toUpperCase() : <User className="size-3.5" />}
                </span>
              )}
              <span className="hidden text-left lg:block">
                <span className="block text-[11px] leading-4 font-medium text-foreground">
                  {authenticated && user ? user.name || user.login : t("guest")}
                </span>
                <span className="block text-[9.5px] leading-3 text-muted-foreground">
                  {authenticated ? (isDemo ? t("demoAccount") : `@${user?.login}`) : t("demoLabel")}
                </span>
              </span>
              <ChevronDown
                className="hidden size-3 text-muted-foreground lg:block"
                aria-hidden="true"
              />
            </button>

            {openPanel === "profile" ? (
              <div
                id="topbar-profile-panel"
                role="dialog"
                aria-label={t("profilePreview")}
                className="popover panel absolute top-[calc(100%+10px)] right-0 z-50 w-[270px] overflow-hidden"
              >
                <div className="flex items-center gap-2.5 border-b border-border px-3 py-3">
                  {authenticated && user?.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      unoptimized
                      className="size-8 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-accent-muted text-[10px] font-semibold text-foreground ring-1 ring-border">
                      {authenticated && user ? user.login.slice(0, 2).toUpperCase() : <User className="size-4" />}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-foreground">
                      {authenticated && user ? user.name || user.login : t("guest")}
                    </p>
                    <p className="truncate text-[10.5px] text-muted-foreground">
                      {authenticated && user ? `@${user.login}` : t("guestDescription")}
                    </p>
                  </div>
                  <Badge variant={authenticated && !isDemo ? "accent" : "outline"} className="ml-auto shrink-0">
                    {authenticated ? (isDemo ? "Demo" : t("real")) : t("demoLabel")}
                  </Badge>
                </div>

                <div className="p-1.5 space-y-1">
                  {authenticated && user ? <a href={`https://github.com/${encodeURIComponent(user.login)}`} target="_blank" rel="noopener noreferrer" onClick={closePanel} className="flex h-9 items-center rounded-md px-3 text-sm text-foreground hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("profileLink")}</a> : null}
                  <Link
                    href="/settings"
                    onClick={closePanel}
                    className="flex h-9 items-center gap-2 rounded-[6px] px-2 text-[11.5px] text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                  >
                    <Palette className="size-3.5" aria-hidden="true" />
                    {t("settings")}
                  </Link>

                  {authenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        closePanel();
                        logout();
                      }}
                      className="flex h-9 w-full items-center gap-2 rounded-[6px] px-2 text-[11.5px] text-danger transition-colors hover:bg-danger-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                    >
                      <LogOut className="size-3.5" aria-hidden="true" />
                      {t("signOut")}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          closePanel();
                          login();
                        }}
                        className="flex h-9 w-full items-center gap-2 rounded-[6px] bg-accent px-2 text-[11.5px] font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                      >
                        <LogIn className="size-3.5" aria-hidden="true" />
                        {t("signInWithGithub")}
                      </button>
                    </>
                  )}
                </div>

                <p className="border-t border-border bg-surface-secondary px-3 py-2 text-[9.5px] leading-4 text-muted-foreground">
                  {authenticated
                    ? (isDemo ? t("demoWorkspaceCopy") : t("authSuccess"))
                    : t("oauthConfigHelp")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function QuickLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex h-9 items-center gap-2 rounded-[6px] px-2 text-[11.5px] text-muted-foreground transition-colors",
        "hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
      )}
    >
      {icon}
      {label}
      <ChevronRight className="ml-auto size-3" aria-hidden="true" />
    </Link>
  );
}


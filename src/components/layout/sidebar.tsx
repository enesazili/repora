"use client";

import type { Ref } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { ReporaLogo } from "@/components/brand/repora-logo";
import {
  ANALYTICS_NAV,
  SETTINGS_NAV,
  type NavItem,
} from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n";
import packageInfo from "../../../package.json";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
  closeButtonRef?: Ref<HTMLButtonElement>;
}

export function Sidebar({
  className,
  onNavigate,
  onClose,
  closeButtonRef,
}: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <aside
      aria-label={t("primaryNavigation")}
      className={cn(
        "app-sidebar flex h-dvh w-[248px] flex-col",
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label={t("homeLabel")}
          className="rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]"
        >
          <ReporaLogo />
        </Link>
        {onClose ? (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t("closeNavigation")}
            className="grid size-9 place-items-center rounded-[8px] text-muted-foreground hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-2 pb-2 text-[9.5px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
          {t("analytics")}
        </p>
        <ul className="space-y-0.5">
          {ANALYTICS_NAV.map((item) => (
            <li key={item.href}>
              <SidebarLink
                item={item}
                label={t(item.label.toLowerCase() as "overview" | "repositories" | "contributions" | "languages" | "activity" | "insights")}
                active={
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href
                }
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-border pt-4">
          <ul>
            <li>
              <SidebarLink
                item={SETTINGS_NAV}
                label={t("settings")}
                active={pathname === SETTINGS_NAV.href}
                onNavigate={onNavigate}
              />
            </li>
          </ul>
        </div>
      </nav>

      <div className="shrink-0 p-3">
        <p className="px-2 text-sm font-semibold text-foreground">Repora</p>
        <p className="mt-1 px-2 text-xs text-muted-foreground">v{packageInfo.version}</p>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  label,
  active,
  onNavigate,
}: {
  item: NavItem;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const { t } = useLocale();

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-[13px] transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
        active
          ? "bg-accent-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
        />
      ) : null}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-accent"
            : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden="true"
        strokeWidth={1.9}
      />
      <span className="truncate">{label}</span>
      {!item.available ? (
        <span className="ml-auto text-[9px] font-medium tracking-[0.08em] text-muted-foreground/80 uppercase">
          {t("soon")}
        </span>
      ) : null}
    </Link>
  );
}

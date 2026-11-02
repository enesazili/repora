import {
  Info,
  Languages,
  LayoutGrid,
  Palette,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n";

export function SettingsNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "horizontal";
}) {
  const { t } = useLocale();

  const sections = [
    { href: "#appearance", label: t("appearance"), icon: Palette },
    { href: "#dashboard-settings", label: t("dashboardLayout"), icon: LayoutGrid },
    { href: "#language", label: t("languageSetting"), icon: Languages },
    { href: "#account", label: t("accountSettings"), icon: User },
    { href: "#preferences", label: t("preferences"), icon: SlidersHorizontal },
    { href: "#about", label: t("aboutBuild"), icon: Info },
  ];

  if (variant === "horizontal") {
    return (
      <nav
        aria-label={t("settings")}
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <a
              key={section.href}
              href={section.href}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[11.5px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className="whitespace-nowrap">{section.label}</span>
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label={t("settings")} className="sticky top-24 space-y-0.5">
      <p className="px-2 pb-2 text-[9.5px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
        {t("settings")}
      </p>
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <a
            key={section.href}
            href={section.href}
            className={cn(
              "flex h-9 items-center gap-2 rounded-[6px] px-2 text-[11.5px] text-muted-foreground transition-colors",
              "hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="truncate">{section.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

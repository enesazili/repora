"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getPalette } from "@/config/themes";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/i18n";

function isCustomDashboard(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return (
      Array.isArray(parsed.overviewOrder) ||
      Array.isArray(parsed.overviewHidden) ||
      typeof parsed.overviewRepository === "string"
    );
  } catch {
    return false;
  }
}

export function PreferencesSettings() {
  const { palette, mode, glass, reducedMotion, resetAllPreferences } = useTheme();
  const { preferences, authenticated } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const hydrated = useHydrated();
  const [resetDone, setResetDone] = useState(false);

  const activePalette = hydrated ? getPalette(palette).name : "Default";
  const activeMode = hydrated ? mode : "dark";
  const glassEnabled = hydrated ? glass : true;
  const motionReduced = hydrated ? reducedMotion : false;
  const dashboardCustom = isCustomDashboard(preferences?.widget_config);

  function handleResetAll() {
    resetAllPreferences();
    setLocale("en");
    setResetDone(true);
    window.setTimeout(() => setResetDone(false), 2500);
  }

  const rows = [
    {
      label: t("appearance"),
      value: `${activePalette} · ${t(activeMode)}`,
    },
    {
      label: t("glassTitle"),
      value: glassEnabled ? t("on") : t("off"),
    },
    {
      label: t("reduceMotion"),
      value: motionReduced ? t("on") : t("off"),
    },
    {
      label: t("languageSetting"),
      value: locale === "tr" ? t("turkish") : t("english"),
    },
    {
      label: t("dashboardLayout"),
      value: dashboardCustom ? t("customLayout") : t("defaultLayout"),
    },
  ];

  return (
    <Panel id="preferences" className="scroll-mt-32 overflow-hidden xl:scroll-mt-24">
      <PanelHeader
        title={t("preferences")}
        description={t("preferencesDescription")}
        actions={
          <Badge variant="outline">
            {authenticated ? t("accountSynced") : t("savedLocally")}
          </Badge>
        }
      />

      <dl className="divide-y divide-border border-t border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
          >
            <dt className="min-w-0 text-[12px] text-muted-foreground">{row.label}</dt>
            <dd className="shrink-0 text-[12px] font-medium text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 border-t border-border bg-surface-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-foreground">
            {t("resetAllPreferences")}
          </p>
          <p className="mt-0.5 text-[10.5px] leading-4 text-muted-foreground">
            {t("resetAllDescription")}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetAll}
          disabled={!hydrated}
          className="shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t("resetAllPreferences")}
        </Button>
      </div>

      {resetDone ? (
        <p
          role="status"
          className="border-t border-border bg-success-muted px-4 py-2 text-center text-[11px] text-success sm:px-5"
        >
          {t("resetDone")}
        </p>
      ) : null}
    </Panel>
  );
}

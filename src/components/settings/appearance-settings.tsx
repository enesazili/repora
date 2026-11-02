"use client";

import { Layers, Moon, RotateCcw, ShieldCheck, Sun, Waves } from "lucide-react";
import { ThemeCard } from "@/components/settings/theme-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Switch } from "@/components/ui/switch";
import {
  COLOR_MODES,
  DEFAULT_PALETTE_ID,
  PALETTES,
  getPalette,
  type ColorMode,
} from "@/config/themes";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n";

const MODE_ICONS: Record<ColorMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
};

export function AppearanceSettings() {
  const {
    palette,
    mode,
    glass,
    reducedMotion,
    setPalette,
    setMode,
    setGlass,
    setReducedMotion,
    resetAppearance,
  } = useTheme();
  const hydrated = useHydrated();
  const { t } = useLocale();

  const activePalette = hydrated ? palette : DEFAULT_PALETTE_ID;
  const activeMode = hydrated ? mode : "dark";
  const activeDefinition = getPalette(activePalette);
  const glassEnabled = hydrated ? glass : true;
  const motionReduced = hydrated ? reducedMotion : false;

  return (
    <Panel className="scroll-mt-32 overflow-hidden xl:scroll-mt-24" id="appearance">
      <PanelHeader
        title={t("appearance")}
        description={t("choosePalette")}
        actions={
          <Badge variant="accent" dot>
            {activeDefinition.name} · {t(activeMode)}
          </Badge>
        }
      />

      <div className="border-t border-border px-4 pt-4 pb-5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-foreground">{t("colorMode")}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              {t("colorModeDescription")}
            </p>
          </div>

          <div
            role="group"
            aria-label={t("colorMode")}
            className="flex shrink-0 rounded-[9px] border border-border bg-surface-secondary p-0.5"
          >
            {COLOR_MODES.map((item) => {
              const Icon = MODE_ICONS[item];
              const pressed = activeMode === item;

              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setMode(item)}
                  disabled={!hydrated}
                  className={cn(
                    "inline-flex h-9 min-w-[92px] items-center justify-center gap-1.5 rounded-[7px] px-3 text-[11.5px] font-medium transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
                    "disabled:pointer-events-none disabled:opacity-60",
                    pressed
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {t(item)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-[12px] font-medium text-foreground">{t("palette")}</p>
          <p className="text-[10.5px] text-muted-foreground">
            {t("appearanceCombinations")}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label={t("palette")}
          className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {PALETTES.map((item) => (
            <ThemeCard
              key={item.id}
              palette={item}
              mode={activeMode}
              selected={item.id === activePalette}
              onSelect={setPalette}
            />
          ))}
        </div>

        <div className="mt-4 divide-y divide-border border-t border-border">
          <div className="flex items-start justify-between gap-4 py-4">
            <div className="flex min-w-0 gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[7px] border border-border bg-surface-secondary text-muted-foreground">
                <Layers className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-foreground">
                  {t("frostedSurfaces")}
                </p>
                <p
                  id="glass-description"
                  className="mt-0.5 max-w-xl text-[11px] leading-4 text-muted-foreground"
                >
                  {t("glassDetail")}
                </p>
              </div>
            </div>
            <Switch
              checked={glassEnabled}
              onChange={setGlass}
              label={t("glassTitle")}
              describedBy="glass-description"
              disabled={!hydrated}
            />
          </div>

          <div className="flex items-start justify-between gap-4 py-4">
            <div className="flex min-w-0 gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[7px] border border-border bg-surface-secondary text-muted-foreground">
                <Waves className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-foreground">
                  {t("reduceMotion")}
                </p>
                <p
                  id="motion-description"
                  className="mt-0.5 max-w-xl text-[11px] leading-4 text-muted-foreground"
                >
                  {t("reduceMotionDescription")}
                </p>
              </div>
            </div>
            <Switch
              checked={motionReduced}
              onChange={setReducedMotion}
              label={t("reduceMotion")}
              describedBy="motion-description"
              disabled={!hydrated}
            />
          </div>
        </div>

        <div className="flex items-start gap-2.5 border-t border-border bg-surface-secondary px-4 py-3 sm:px-5">
          <ShieldCheck
            className="mt-0.5 size-3.5 shrink-0 text-success"
            aria-hidden="true"
          />
          <p className="text-[10.5px] leading-4 text-muted-foreground">
            {t("glassPrivacy")}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10.5px] leading-4 text-muted-foreground">
            {t("themeStorage")}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={resetAppearance}
            disabled={!hydrated}
            className="shrink-0"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t("resetAppearance")}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

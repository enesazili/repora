"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import {
  DEFAULT_DASHBOARD_ORDER,
  parseDashboardLayout,
  serializeDashboardLayout,
  type DashboardWidgetId,
} from "@/lib/dashboard-layout";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/i18n";

export function DashboardSettings() {
  const { preferences, updatePreferences, favorites, authenticated, loading } = useAuth();
  const { t } = useLocale();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  const layout = parseDashboardLayout(preferences?.widget_config);
  const disabled = saving || !authenticated || loading;

  const names: Record<DashboardWidgetId, string> = {
    summary: t("dashboardSummary"),
    recent: t("accountRecentlyUpdated"),
    languages: t("languageMix"),
    favorites: t("accountFavoriteCount"),
    activity: t("dashboardRepoActivity"),
  };

  async function save(
    overrides: Partial<
      Pick<typeof layout, "order" | "hidden" | "repository">
    >,
  ) {
    if (saving) return;
    setSaving(true);
    setError(false);
    const ok = await updatePreferences({
      widget_config: serializeDashboardLayout(layout, overrides),
    });
    if (ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } else {
      setError(true);
    }
    setSaving(false);
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...layout.order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    void save({ order: next });
  }

  function toggleVisibility(id: DashboardWidgetId) {
    const hidden = layout.hidden.includes(id)
      ? layout.hidden.filter((item) => item !== id)
      : [...layout.hidden, id];
    void save({ hidden });
  }

  return (
    <Panel id="dashboard-settings" className="scroll-mt-32 overflow-hidden xl:scroll-mt-24">
      <PanelHeader
        title={t("dashboardCustomize")}
        description={t("dashboardSettingsDescription")}
        actions={
          <Badge variant={saved ? "accent" : "outline"} dot={saved}>
            {saving ? t("saving") : saved ? t("savedSuccessfully") : t("dashboardLayout")}
          </Badge>
        }
      />

      <div className="border-t border-border px-4 py-4 sm:px-5">
        <p className="text-[11px] font-medium text-foreground">
          {t("dashboardSections")}
        </p>
        <ul className="mt-2 divide-y divide-border rounded-[10px] border border-border">
          {layout.order.map((id, index) => (
            <li key={id} className="flex items-center gap-2 px-3 py-2.5">
              <label className="flex min-w-0 flex-1 items-center gap-2.5 text-[12px] text-foreground">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={!layout.hidden.includes(id)}
                  onChange={() => toggleVisibility(id)}
                  className="size-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0 truncate">{names[id]}</span>
              </label>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`${t("dashboardMoveUp")}: ${names[id]}`}
                  className="grid size-9 place-items-center rounded-[7px] border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                >
                  <ChevronUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === layout.order.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`${t("dashboardMoveDown")}: ${names[id]}`}
                  className="grid size-9 place-items-center rounded-[7px] border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <label className="mt-4 block">
          <span className="text-[11px] font-medium text-foreground">
            {t("dashboardChooseFavorite")}
          </span>
          <select
            disabled={disabled || favorites.length === 0}
            value={
              favorites.some((item) => item.repo_full_name === layout.repository)
                ? layout.repository || ""
                : favorites[0]?.repo_full_name || ""
            }
            onChange={(event) => void save({ repository: event.target.value })}
            className="mt-1.5 block h-9 w-full min-w-0 rounded-[8px] border border-border bg-surface px-3 text-[12px] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:opacity-60"
          >
            <option value="">{t("accountNoFavorites")}</option>
            {favorites.map((item) => (
              <option key={item.repo_id} value={item.repo_full_name}>
                {item.repo_full_name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10.5px] leading-4 text-muted-foreground">
            {t("dashboardFavoriteDescription")}
          </span>
        </label>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-[10.5px] leading-4 text-muted-foreground">
            {t("dashboardResetDescription")}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() =>
              void save({
                order: [...DEFAULT_DASHBOARD_ORDER],
                hidden: [],
                repository: "",
              })
            }
            className="shrink-0"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t("dashboardReset")}
          </Button>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-[11px] text-danger">
            {t("dashboardSaveError")}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

import Link from "next/link";
import { ArrowUpRight, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PALETTES } from "@/config/themes";
import { useLocale } from "@/i18n";
import packageInfo from "../../../package.json";

export function AboutSettings() {
  const { t } = useLocale();
  return (
    <Panel id="about" className="scroll-mt-32 overflow-hidden xl:scroll-mt-24">
      <PanelHeader
        title={t("aboutBuild")}
        description={t("aboutPhase")}
        actions={<Badge variant="outline">v{packageInfo.version}</Badge>}
      />

      <div className="grid grid-cols-1 border-t border-border sm:grid-cols-3">
        <div className="border-b border-border px-5 py-3.5 sm:border-r sm:border-b-0">
          <p className="text-[9.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t("themesLabel")}
          </p>
          <p className="tnum mt-0.5 text-[16px] font-semibold text-foreground">
            {PALETTES.length * 2}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t("themeCountDescription")}
          </p>
        </div>
        <div className="border-b border-border px-5 py-3.5 sm:border-r sm:border-b-0">
          <p className="text-[9.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t("dataSource")}
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-foreground">
            {t("dataSourceValue")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t("dataSourceDescription")}
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[9.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t("preferences")}
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-foreground">
            {t("localBrowser")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t("themeGlassPreferences")}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 border-t border-border bg-surface-secondary px-5 py-3">
        <ShieldCheck
          className="mt-0.5 size-3.5 shrink-0 text-success"
          aria-hidden="true"
        />
        <p className="text-[10.5px] leading-4 text-muted-foreground">
          {t("aboutPrototype")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-1 rounded-[6px] px-2 text-[11px] text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {t("returnOverview")}
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
          <FileText className="size-3" aria-hidden="true" />
          {t("architectureLink")}
        </span>
      </div>
    </Panel>
  );
}

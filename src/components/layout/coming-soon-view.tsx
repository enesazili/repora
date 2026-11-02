"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, Compass, Palette, Sparkles } from "lucide-react";
import { getNavItemByFeature } from "@/config/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { useLocale } from "@/i18n";

const FEATURE_COPY = {
  repositories: { description: "featureRepositories", previews: ["previewRepo1", "previewRepo2", "previewRepo3"] },
  contributions: { description: "featureContributions", previews: ["previewContrib1", "previewContrib2", "previewContrib3"] },
  languages: { description: "featureLanguages", previews: ["previewLang1", "previewLang2", "previewLang3"] },
  activity: { description: "featureActivity", previews: ["previewActivity1", "previewActivity2", "previewActivity3"] },
  insights: { description: "featureInsights", previews: ["previewInsights1", "previewInsights2", "previewInsights3"] },
} as const;

export function ComingSoonView({ feature }: { feature: string }) {
  const { t, locale } = useLocale();
  const item = getNavItemByFeature(feature);
  const copy = FEATURE_COPY[feature as keyof typeof FEATURE_COPY];
  useEffect(() => {
    if (item) document.title = `${t(item.label.toLowerCase() as keyof typeof import("@/i18n").MESSAGES.en)} — ${t("comingSoon")} · Repora`;
  }, [item, locale, t]);
  if (!item || !copy) return null;
  const Icon = item.icon;
  const featureLabel = t(feature as keyof typeof import("@/i18n").MESSAGES.en);
  const previewKeys = copy.previews as readonly (keyof typeof import("@/i18n").MESSAGES.en)[];

  return <div className="space-y-6">
    <PageHeader eyebrow={t("plannedModule")} title={featureLabel} description={t(copy.description)} actions={<Badge variant="outline">Phase {item.phase}</Badge>} />
    <Panel className="overflow-hidden">
      <div className="relative flex flex-col items-start gap-5 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{background:"radial-gradient(28rem 16rem at 15% 0%, var(--accent-subtle), transparent 70%)"}} />
        <span className="relative grid size-14 shrink-0 place-items-center rounded-[14px] border border-border bg-surface-secondary text-accent"><Icon className="size-6" aria-hidden="true" strokeWidth={1.7}/></span>
        <div className="relative min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="accent" dot>{t("comingSoon")}</Badge><span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground"><Clock3 className="size-3" aria-hidden="true"/>{t("scheduledPhase")} {item.phase}</span></div>
          <h2 className="mt-2.5 text-[19px] leading-tight font-semibold tracking-[-0.025em] text-foreground">{featureLabel} {t("designedNotBuilt")}</h2>
          <p className="mt-1.5 max-w-xl text-[12px] leading-5 text-muted-foreground">{t("phaseOneExplanation")}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 border-t border-border sm:grid-cols-2">
        <div className="border-b border-border px-6 py-5 sm:border-r sm:border-b-0"><p className="text-[9.5px] font-semibold tracking-[0.11em] text-muted-foreground uppercase">{t("moduleWillInclude")}</p><ul className="mt-3 space-y-2">{previewKeys.map((key) => <li key={key} className="flex items-start gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true"/><span className="text-[11.5px] leading-4 text-muted-foreground">{t(key)}</span></li>)}</ul></div>
          <div className="px-6 py-5"><p className="text-[9.5px] font-semibold tracking-[0.11em] text-muted-foreground uppercase">{t("howBuilt")}</p><ol className="mt-3 space-y-2.5"><Step done title={t("foundationStep")} meta={t("currentPhaseOne")}/><Step title={t("githubIntegrationStep")} meta="Phase 3"/><Step title={`${featureLabel} ${t("analyticsSuffix")}`} meta={`Phase ${item.phase}`}/></ol></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-secondary px-6 py-3"><Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-border bg-surface px-2.5 text-[11px] text-foreground"><ArrowLeft className="size-3" aria-hidden="true"/>{t("backOverview")}</Link><Link href="/settings" className="inline-flex h-9 items-center gap-1.5 rounded-[6px] px-2.5 text-[11px] text-muted-foreground"><Palette className="size-3" aria-hidden="true"/>{t("tryTheme")}<ArrowRight className="size-3" aria-hidden="true"/></Link><span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Sparkles className="size-3" aria-hidden="true"/>{t("nothingLive")}</span></div>
    </Panel>
    <Panel className="flex flex-col items-start gap-3 px-5 py-4 sm:flex-row sm:items-center"><span className="grid size-8 shrink-0 place-items-center rounded-[8px] border border-border bg-surface-secondary text-muted-foreground"><Compass className="size-4" aria-hidden="true"/></span><p className="min-w-0 flex-1 text-[11px] leading-4 text-muted-foreground"><span className="font-medium text-foreground">{t("reviewPhase")}</span> {t("reviewDescription")}</p><Link href="/settings" className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[6px] border border-border bg-surface px-2.5 text-[11px] text-foreground">{t("openSettings")}<ArrowRight className="size-3" aria-hidden="true"/></Link></Panel>
  </div>;
}

export function ComingSoonLoading() {
  const { t } = useLocale();
  return <div className="space-y-6" aria-busy="true" aria-label={t("loadingModule")}><p className="sr-only">{t("loadingModule")}</p><div className="space-y-2"><div className="h-3 w-24 rounded-full bg-muted"/><div className="h-7 w-52 rounded-md bg-muted"/><div className="h-3 w-full max-w-xl rounded-full bg-muted"/></div><div className="panel h-64 animate-pulse"/></div>;
}

function Step({ done = false, title, meta }: { done?: boolean; title: string; meta: string }) {
  return <li className="flex items-start gap-2.5"><span aria-hidden="true" className={done ? "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-success-muted text-success" : "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-border bg-surface text-[8px] font-semibold text-muted-foreground"}>{done ? <Check className="size-2.5" strokeWidth={3}/> : "•"}</span><span className="min-w-0"><span className="block text-[11.5px] leading-4 text-foreground">{title}</span><span className="block text-[10px] leading-4 text-muted-foreground">{meta}</span></span></li>;
}

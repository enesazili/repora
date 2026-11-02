"use client";
import { Languages } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useLocale } from "@/i18n";

export function LanguageSettings() {
  const { locale, setLocale, t } = useLocale();
  return <Panel id="language" className="scroll-mt-32 overflow-hidden xl:scroll-mt-24"><PanelHeader title={t("languageSetting")} description={t("chooseLanguage")} actions={<Languages className="size-4 text-muted-foreground" aria-hidden="true"/>}/><div className="flex flex-wrap gap-2 border-t border-border p-4" role="group" aria-label={t("languageSetting")}>
    {([ ["en", t("english")], ["tr", t("turkish")] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={locale === value} onClick={() => setLocale(value)} className={`h-9 rounded-[8px] border px-4 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${locale === value ? "border-accent bg-accent-subtle text-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}>{label}</button>)}
  </div></Panel>;
}

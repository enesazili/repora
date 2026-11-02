"use client";

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { ReporaLogo } from "@/components/brand/repora-logo";
import { useLocale } from "@/i18n";

export function NotFoundView() {
  const { t } = useLocale();
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6 py-12">
      <div className="app-ambient" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <ReporaLogo showPreview={false} />
        <div className="panel mt-6 p-6">
          <span className="grid size-10 place-items-center rounded-[10px] border border-border bg-surface-secondary text-muted-foreground"><Compass className="size-5" aria-hidden="true" /></span>
          <p className="mt-4 text-[9.5px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">404</p>
          <h1 className="mt-1 text-[24px] leading-tight font-semibold tracking-[-0.03em] text-foreground">{t("pageNotFound")}</h1>
          <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{t("notFoundDescription")}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-accent px-3 text-[12px] font-medium text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"><ArrowLeft className="size-3.5" aria-hidden="true" />{t("backOverview")}</Link>
            <Link href="/settings" className="inline-flex h-9 items-center rounded-[8px] border border-border bg-surface px-3 text-[12px] text-foreground transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">{t("settings")}</Link>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">Repora · {t("phaseThree")}</p>
      </div>
    </main>
  );
}

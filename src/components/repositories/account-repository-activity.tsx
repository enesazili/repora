"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/i18n";
import { Panel } from "@/components/ui/panel";
import { RepositoryWorkflow } from "@/components/repositories/repository-workflow";

interface Activity {
  commits: { sha: string; message: string; date: string; author: string | null }[];
  languages: { name: string; bytes: number }[];
  totalLanguageBytes: number;
  commitLimitReached: boolean;
}

export function AccountRepositoryActivity({ fullName, onClose }: { fullName: string; onClose?: () => void }) {
  const { t, date, number, locale } = useLocale();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "expired">("loading");
  const [range, setRange] = useState<30 | 90>(30);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    const controller = new AbortController();
    const [owner, repo] = fullName.split("/");
    const query = new URLSearchParams({ owner, repo, range: String(range), page: String(page) });
    fetch(`/api/user/repository-activity?${query}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) { setStatus("expired"); return; }
        if (!response.ok) throw new Error("upstream");
        const data: Activity = await response.json();
        setActivity((previous) => page === 1 || !previous ? data : { ...previous, commits: [...previous.commits, ...data.commits.filter((commit) => !previous.commits.some((item) => item.sha === commit.sha))], commitLimitReached: data.commitLimitReached });
        setHasMore(data.commitLimitReached && page < 10);
        setLoadingMore(false);
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) { setLoadingMore(false); if (page > 1) { setLoadError(true); setHasMore(false); } else setStatus("error"); } });
    return () => controller.abort();
  }, [fullName, range, page, retryCount]);

  const days = useMemo(() => {
    if (!activity) return [];
    const counts = new Map<string, number>();
    for (const commit of activity.commits) {
      const key = commit.date.slice(0, 10);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from({ length: range }, (_, index) => {
      const day = new Date();
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - (range - 1 - index));
      const key = day.toISOString().slice(0, 10);
      return { key, count: counts.get(key) || 0 };
    });
  }, [activity, range]);
  const max = Math.max(1, ...days.map((day) => day.count));
  const periods = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const day of days) {
      const value = new Date(`${day.key}T00:00:00Z`);
      if (granularity === "week") value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
      if (granularity === "month") value.setUTCDate(1);
      const key = granularity === "day" ? day.key : value.toISOString().slice(0, 10);
      grouped.set(key, (grouped.get(key) || 0) + day.count);
    }
    return [...grouped].map(([key, count]) => ({ key, count }));
  }, [days, granularity]);
  const maxPeriod = Math.max(1, ...periods.map((period) => period.count));
  const contributors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const commit of activity?.commits || []) if (commit.author) counts.set(commit.author, (counts.get(commit.author) || 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [activity]);
  const totalBytes = Math.max(1, activity?.totalLanguageBytes || 0);

  return (
    <Panel className="space-y-5 p-4 sm:p-5" aria-label={fullName}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="break-all text-base font-semibold text-foreground">{fullName} · {t("repoActivityTitle")}</h2>
        {onClose ? <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("closeComparison")}</button> : null}
      </div>
      <label className="block text-xs text-muted-foreground">{t("commitRange")}<select value={range} onChange={(event) => { setRange(Number(event.target.value) as 30 | 90); setPage(1); setActivity(null); setStatus("loading"); setLoadError(false); }} className="ml-2 rounded-md border border-border bg-surface px-2 py-1.5 text-foreground"><option value="30">{t("commit30Days")}</option><option value="90">{t("commit90Days")}</option></select></label>
      {status === "loading" ? <p role="status" className="text-sm text-muted-foreground">{t("repoActivityLoading")}</p> : null}
      {status === "expired" ? <p role="alert" className="text-sm text-danger">{t("accountReposExpired")}</p> : null}
      {status === "error" ? <p role="alert" className="text-sm text-danger">{t("repoActivityError")}</p> : null}
      {status === "ready" && activity ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="min-w-0 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t("repoCommitTrend")}</h3>
            <p className="text-xs text-muted-foreground">{t("repoActivityScope")}</p>
            <p className="text-xs text-muted-foreground">{t("commitLoadedCount").replace("{count}", number(activity.commits.length))}</p>
            <div className="grid max-w-64 grid-cols-7 gap-1" role="img" aria-label={t("commitHeatmapLabel")}>
              {days.map((day) => <span key={day.key} className="aspect-square rounded-sm bg-accent" style={{ opacity: day.count ? Math.max(0.4, day.count / max) : 0.12 }} title={`${date(day.key)}: ${number(day.count)}`} />)}
            </div>
            <ul className="sr-only">{days.map((day) => <li key={day.key}>{date(day.key)}: {number(day.count)}</li>)}</ul>
            <label className="block text-xs text-muted-foreground">{t("commitGrouping")}<select value={granularity} onChange={(event) => setGranularity(event.target.value as "day" | "week" | "month")} className="ml-2 rounded-md border border-border bg-surface px-2 py-1.5 text-foreground"><option value="day">{t("commitDaily")}</option><option value="week">{t("commitWeekly")}</option><option value="month">{t("commitMonthly")}</option></select></label>
            <div className="flex max-h-48 items-end gap-1 overflow-x-auto border-b border-border pb-1" role="img" aria-label={t("commitTrendLabel")}>{periods.map((period) => <span key={period.key} className="min-w-2 flex-1 rounded-t-sm bg-accent" style={{ height: `${Math.max(3, period.count / maxPeriod * 144)}px` }} title={`${date(period.key)}: ${number(period.count)}`} />)}</div>
            <ul className="sr-only">{periods.map((period) => <li key={period.key}>{date(period.key)}: {number(period.count)}</li>)}</ul>
            {hasMore ? <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); setPage((current) => current + 1); }} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{loadingMore ? t("repoActivityLoading") : t("commitLoadMore")}</button> : null}
            {loadError ? <p role="alert" className="text-xs text-danger">{t("repoActivityError")} <button type="button" onClick={() => { setLoadError(false); setLoadingMore(true); setRetryCount((current) => current + 1); }} className="underline">{t("refresh")}</button></p> : null}
            {activity.commitLimitReached ? <p className="text-xs text-warning">{t("repoCommitLimit")}</p> : null}
            <h3 className="pt-2 text-sm font-semibold text-foreground">{t("repoRecentCommits")}</h3>
            {activity.commits.length === 0 ? <p className="text-sm text-muted-foreground">{t("repoNoCommits")}</p> : (
              <ul className="divide-y divide-border">
                {activity.commits.slice(0, 10).map((commit) => <li key={commit.sha} className="min-w-0 py-2 text-xs">
                  <p className="break-words text-foreground">{commit.message}</p>
                  <p className="mt-1 font-mono text-muted-foreground">{commit.sha.slice(0, 7)} · {date(commit.date)}</p>
                </li>)}
              </ul>
            )}
          </section>
          <section className="min-w-0 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t("repoLanguageBytes")}</h3>
            {activity.languages.length === 0 ? <p className="text-sm text-muted-foreground">{t("noLanguage")}</p> : (
              <ul className="space-y-3">
                {activity.languages.map((language) => <li key={language.name}>
                  <div className="mb-1 flex justify-between gap-3 text-xs text-foreground"><span className="truncate">{language.name}</span><span>{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(language.bytes / totalBytes)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${language.bytes / totalBytes * 100}%` }} /></div>
                </li>)}
              </ul>
            )}
            <h3 className="pt-3 text-sm font-semibold text-foreground">{t("contributorSampleTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("contributorSampleScope")}</p>
            {contributors.length ? <ul className="space-y-2">{contributors.map(([login, count]) => <li key={login} className="flex justify-between gap-2 text-xs text-foreground"><span className="min-w-0 truncate">{login}</span><span>{number(count)}</span></li>)}</ul> : <p className="text-xs text-muted-foreground">{t("contributorSampleEmpty")}</p>}
          </section>
        </div>
      ) : null}
      <RepositoryWorkflow fullName={fullName} />
    </Panel>
  );
}

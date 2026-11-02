"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { useLocale } from "@/i18n";

export interface ComparedRepository {
  id: number;
  full_name: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

interface Sample { commits: number; openPr: number; mergedPr: number; openIssues: number }

export function AccountComparison({ repositories, onClose }: { repositories: ComparedRepository[]; onClose: () => void }) {
  const { t, number } = useLocale();
  const [samples, setSamples] = useState<Record<number, Sample>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(repositories.map(async (repo) => {
      const [owner, name] = repo.full_name.split("/");
      const base = new URLSearchParams({ owner, repo: name });
      const [activity, workflow] = await Promise.all([
        fetch(`/api/user/repository-activity?${base}&range=30&page=1`, { signal: controller.signal, cache: "no-store" }),
        fetch(`/api/user/repository-workflow?${base}`, { signal: controller.signal, cache: "no-store" }),
      ]);
      if (!activity.ok || !workflow.ok) throw new Error("sample");
      const a = await activity.json();
      const w = await workflow.json();
      return [repo.id, { commits: a.commits.length, openPr: w.pullRequests.filter((item: { state: string }) => item.state === "open").length, mergedPr: w.pullRequests.filter((item: { mergedAt: string | null }) => item.mergedAt).length, openIssues: w.issues.filter((item: { state: string }) => item.state === "open").length }] as const;
    })).then((entries) => { if (!controller.signal.aborted) { setSamples(Object.fromEntries(entries)); setLoading(false); } })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setLoading(false); } });
    return () => controller.abort();
  }, [repositories]);

  const maxStars = Math.max(1, ...repositories.map((repo) => repo.stargazers_count));
  return <Panel className="space-y-4 p-4 sm:p-5" aria-label={t("accountComparisonTitle")}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold text-foreground">{t("accountComparisonTitle")}</h2><button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("closeComparison")}</button></div>
    <p className="text-xs text-muted-foreground">{t("accountComparisonScope")}</p>
    {repositories.every((repo) => !repo.private) ? <a href={`/reports/compare?${new URLSearchParams({ repos: repositories.map((repo) => repo.full_name).join(",") })}`} className="inline-block rounded-md border border-border px-3 py-1.5 text-xs text-accent focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("publicComparisonOpen")}</a> : null}
    {loading ? <p role="status" className="text-sm text-muted-foreground">{t("repoActivityLoading")}</p> : null}
    {error ? <p role="alert" className="text-sm text-danger">{t("accountComparisonError")}</p> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {repositories.map((repo) => <section key={repo.id} className="min-w-0 rounded-md border border-border bg-surface-secondary p-3">
        <h3 className="break-all text-sm font-semibold text-foreground">{repo.full_name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{repo.private ? t("accountRepoPrivate") : t("accountRepoPublic")} · {repo.language || "—"}</p>
        <dl className="mt-3 space-y-2 text-xs">{[[t("stars"), repo.stargazers_count], [t("forks"), repo.forks_count], [t("accountCompareCommits"), samples[repo.id]?.commits], [t("workflowOpenPr"), samples[repo.id]?.openPr], [t("workflowMergedPr"), samples[repo.id]?.mergedPr], [t("workflowOpenIssues"), samples[repo.id]?.openIssues]].map(([label, value]) => <div key={label} className="flex justify-between gap-2"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium text-foreground">{value === undefined ? "—" : number(Number(value))}</dd></div>)}</dl>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-accent" style={{ width: `${repo.stargazers_count / maxStars * 100}%` }} /></div><p className="mt-1 text-[10px] text-muted-foreground">{t("accountCompareStarsRelative")}</p>
      </section>)}
    </div>
  </Panel>;
}

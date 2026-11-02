"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLocale } from "@/i18n";
import { useRepositoryPages } from "@/components/dashboard/use-repository-pages";
import { Panel } from "@/components/ui/panel";

export default function InsightsPage() {
  const { t, number } = useLocale();
  const { repositories, hasMore, status, loadMore } = useRepositoryPages();
  const ranked = useMemo(() => [...repositories].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10), [repositories]);
  const stars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const forks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
  return <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{t("analytics")}</p><h1 className="mt-2 text-2xl font-semibold text-foreground">{t("insights")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("insightsActualScope")}</p></div>
    {status === "loading" ? <p role="status" className="text-sm text-muted-foreground">{t("accountReposLoading")}</p> : null}{status === "error" ? <p role="alert" className="text-sm text-danger">{t("accountReposError")}</p> : null}{status === "expired" ? <p role="alert" className="text-sm text-danger">{t("accountReposExpired")}</p> : null}
    <div className="grid gap-3 sm:grid-cols-3">{[[t("accountRepoCount"), repositories.length], [t("stars"), stars], [t("forks"), forks]].map(([label, value]) => <Panel key={label} className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold text-foreground">{number(Number(value))}</p></Panel>)}</div>
    <Panel className="p-5"><h2 className="text-lg font-semibold text-foreground">{t("topRepositories")}</h2>{ranked.length ? <ol className="mt-4 divide-y divide-border">{ranked.map((repo) => <li key={repo.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><Link href="/repositories" className="break-all text-foreground hover:text-accent">{repo.full_name}</Link><span className="text-muted-foreground">★ {number(repo.stargazers_count)}</span></li>)}</ol> : <p className="mt-4 text-sm text-muted-foreground">{t("accountReposEmpty")}</p>}{hasMore ? <button type="button" disabled={status === "loading"} onClick={loadMore} className="mt-4 rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50">{t("ownedSearchNext")}</button> : null}</Panel>
  </div>;
}

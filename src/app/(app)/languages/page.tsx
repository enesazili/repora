"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/i18n";
import { useRepositoryPages } from "@/components/dashboard/use-repository-pages";
import { Panel } from "@/components/ui/panel";

interface LanguageShare { name: string; bytes: number }

export default function LanguagesPage() {
  const { t, number, locale } = useLocale();
  const { repositories, hasMore, status, loadMore } = useRepositoryPages();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState("");
  const [languages, setLanguages] = useState<LanguageShare[]>([]);
  const [bytesStatus, setBytesStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const filtered = useMemo(() => repositories.filter((repo) => repo.full_name.toLowerCase().includes(filter.toLowerCase())), [repositories, filter]);
  const totals = useMemo(() => {
    const counts = new Map<string, number>();
    for (const repo of filtered) if (repo.language) counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    const [owner, repo] = selected.split("/");
    fetch(`/api/user/repository-activity?${new URLSearchParams({ owner, repo, range: "30", page: "1" })}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("languages"); const data = await response.json(); setLanguages(data.languages); setBytesStatus("ready"); })
      .catch(() => { if (!controller.signal.aborted) setBytesStatus("error"); });
    return () => controller.abort();
  }, [selected]);
  const maxCount = Math.max(1, ...totals.map((item) => item[1]));
  const totalBytes = languages.reduce((sum, item) => sum + item.bytes, 0);
  return <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{t("analytics")}</p><h1 className="mt-2 text-2xl font-semibold text-foreground">{t("languages")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("languagesActualScope")}</p></div>
    <Panel className="space-y-3 p-5"><label className="block text-sm font-medium text-foreground">{t("searchRepositories")}<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} className="mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]" /></label><p className="text-sm text-muted-foreground">{t("accountRepoCount")}: {number(filtered.length)}{hasMore ? ` · ${t("accountDashboardSample")}` : ""}</p>{hasMore ? <button type="button" disabled={status === "loading"} onClick={loadMore} className="rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50">{t("ownedSearchNext")}</button> : null}</Panel>
    {status === "loading" ? <p role="status" className="text-sm text-muted-foreground">{t("accountReposLoading")}</p> : null}{status === "error" ? <p role="alert" className="text-sm text-danger">{t("accountReposError")}</p> : null}{status === "expired" ? <p role="alert" className="text-sm text-danger">{t("accountReposExpired")}</p> : null}
    <div className="grid gap-4 lg:grid-cols-2"><Panel className="p-5"><h2 className="text-lg font-semibold text-foreground">{t("languageMix")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("languagesPrimaryScope")}</p>{totals.length ? <ul className="mt-5 space-y-4">{totals.map(([name, count]) => <li key={name}><div className="mb-1 flex justify-between text-sm text-foreground"><span>{name}</span><span>{number(count)}</span></div><div className="h-2 rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${count / maxCount * 100}%` }} /></div></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">{t("noLanguage")}</p>}</Panel>
      <Panel className="p-5"><h2 className="text-lg font-semibold text-foreground">{t("repoLanguageBytes")}</h2><label className="mt-3 block text-sm text-muted-foreground">{t("dashboardChooseFavorite")}<select value={selected} onChange={(event) => { setSelected(event.target.value); setBytesStatus(event.target.value ? "loading" : "idle"); setLanguages([]); }} className="mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"><option value="">{t("contributionsChooseRepo")}</option>{filtered.map((repo) => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}</select></label>{bytesStatus === "loading" ? <p role="status" className="mt-4 text-sm">{t("repoActivityLoading")}</p> : null}{bytesStatus === "error" ? <p role="alert" className="mt-4 text-sm text-danger">{t("repoActivityError")}</p> : null}{bytesStatus === "ready" ? languages.length ? <ul className="mt-5 space-y-3">{languages.map((item) => <li key={item.name} className="flex justify-between text-sm text-foreground"><span>{item.name}</span><span>{new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(totalBytes ? item.bytes / totalBytes : 0)}</span></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">{t("noLanguage")}</p> : null}</Panel></div>
  </div>;
}

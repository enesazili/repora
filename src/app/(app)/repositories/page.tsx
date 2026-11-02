"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/i18n";
import { useAuth } from "@/providers/auth-provider";
import { AccountRepositoryActivity } from "@/components/repositories/account-repository-activity";
import { AccountComparison } from "@/components/repositories/account-comparison";
import { RepositorySearch } from "@/components/repositories/repository-search";

export default function RepositoriesPage() {
  return <AccountRepositories />;
}
interface AccountRepo {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  archived: boolean;
  updated_at: string;
}

function AccountRepositories() {
  const { t, locale, number } = useLocale();
  const { isFavorite, toggleFavorite } = useAuth();
  const [repositories, setRepositories] = useState<AccountRepo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteError, setFavoriteError] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "expired" | "error">("loading");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [visibility, setVisibility] = useState("all");
  const [affiliation, setAffiliation] = useState("owner");
  const [serverSort, setServerSort] = useState("updated");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [archived, setArchived] = useState("all");
  const [localSort, setLocalSort] = useState("updated");

  const languages = useMemo(() => Array.from(new Set(repositories.map((repo) => repo.language).filter((value): value is string => Boolean(value)))).sort(), [repositories]);
  const comparedRepositories = useMemo(() => repositories.filter((repo) => compareIds.includes(repo.id)), [repositories, compareIds]);
  const shown = useMemo(() => repositories.filter((repo) => {
    const text = query.trim().toLocaleLowerCase();
    return (!text || `${repo.full_name} ${repo.description || ""} ${repo.language || ""}`.toLocaleLowerCase().includes(text))
      && (language === "all" || repo.language === language)
      && (archived === "all" || repo.archived === (archived === "archived"))
      && (!favoritesOnly || isFavorite(repo.id));
  }).sort((a, b) => localSort === "stars" ? b.stargazers_count - a.stargazers_count : localSort === "forks" ? b.forks_count - a.forks_count : localSort === "name" ? a.full_name.localeCompare(b.full_name) : Date.parse(b.updated_at) - Date.parse(a.updated_at)), [repositories, query, language, archived, favoritesOnly, localSort, isFavorite]);

  function resetListing(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
    setRepositories([]);
    setSelected(null);
    setCompareIds([]);
    setShowComparison(false);
    setStatus("loading");
    setLoadError(false);
  }

  function downloadListing(format: "csv" | "json") {
    const rows = shown.map((repo) => ({ name: repo.full_name, visibility: repo.private ? "private" : "public", language: repo.language || "", stars: repo.stargazers_count, forks: repo.forks_count, updated: repo.updated_at }));
    const csvCell = (value: string | number) => {
      const text = String(value);
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const content = format === "json"
      ? JSON.stringify({ generatedAt: new Date().toISOString(), scope: "loaded-and-filtered", repositories: rows }, null, 2)
      : [[t("accountExportName"), t("accountVisibility"), t("language"), t("stars"), t("forks"), t("updated")].map(csvCell).join(","), ...rows.map((row) => Object.values(row).map(csvCell).join(","))].join("\r\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `repora-repositories-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), visibility, affiliation, sort: serverSort, direction: serverSort === "full_name" ? "asc" : "desc" });
    fetch(`/api/user/repositories?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) { setStatus("expired"); return; }
        if (!response.ok) throw new Error("upstream");
        const data = await response.json();
        setRepositories((previous) => page === 1 ? data.repositories : [...previous, ...data.repositories.filter((repo: AccountRepo) => !previous.some((item) => item.id === repo.id))]);
        setHasMore(Boolean(data.hasMore));
        setLoadingMore(false);
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) { setLoadingMore(false); if (page > 1) { setLoadError(true); setHasMore(false); } else setStatus("error"); } });
    return () => controller.abort();
  }, [page, visibility, affiliation, serverSort, retryCount]);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t("analytics")} title={t("accountReposTitle")} description={t("accountReposDescription")} />
      {status === "loading" ? <Panel className="p-6" role="status">{t("accountReposLoading")}</Panel> : null}
      {status === "expired" ? <Panel className="p-6" role="alert">{t("accountReposExpired")}</Panel> : null}
      {status === "error" ? <Panel className="p-6" role="alert">{t("accountReposError")}</Panel> : null}
      {status === "ready" ? (
        <>
          <RepositorySearch onSelect={setSelected} />
          <Panel className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-muted-foreground">{t("accountOwnership")}<select value={affiliation} onChange={(event) => resetListing(setAffiliation, event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-2 text-foreground"><option value="owner">{t("accountOwned")}</option><option value="collaborator">{t("accountCollaborator")}</option><option value="organization_member">{t("accountOrganizations")}</option><option value="all">{t("allTypes")}</option></select></label>
            <label className="text-xs text-muted-foreground">{t("accountVisibility")}<select value={visibility} onChange={(event) => resetListing(setVisibility, event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-2 text-foreground"><option value="all">{t("allTypes")}</option><option value="public">{t("accountRepoPublic")}</option><option value="private">{t("accountRepoPrivate")}</option></select></label>
            <label className="text-xs text-muted-foreground">{t("accountServerOrder")}<select value={serverSort} onChange={(event) => resetListing(setServerSort, event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-2 text-foreground"><option value="updated">{t("sortUpdated")}</option><option value="pushed">{t("accountLastPush")}</option><option value="created">{t("created")}</option><option value="full_name">{t("sortName")}</option></select></label>
            <label className="text-xs text-muted-foreground">{t("searchRepositories")}<input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-2 text-foreground" type="search" /></label>
            <label className="text-xs text-muted-foreground">{t("filterByLanguage")}<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-2 text-foreground"><option value="all">{t("allLanguages")}</option>{languages.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs text-muted-foreground">{t("archived")}<select value={archived} onChange={(event) => setArchived(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-2 text-foreground"><option value="all">{t("allTypes")}</option><option value="archived">{t("onlyArchived")}</option><option value="active">{t("active")}</option></select></label>
            <label className="text-xs text-muted-foreground">{t("sortBy")}<select value={localSort} onChange={(event) => setLocalSort(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-surface px-2 py-2 text-foreground"><option value="updated">{t("sortUpdated")}</option><option value="stars">{t("sortStars")}</option><option value="forks">{t("sortForks")}</option><option value="name">{t("sortName")}</option></select></label>
          </Panel>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              [t("accountRepoCount"), repositories.length],
              [t("accountPrivateCount"), repositories.filter((repo) => repo.private).length],
              [t("stars"), repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)],
              [t("accountFavoriteCount"), repositories.filter((repo) => isFavorite(repo.id)).length],
            ].map(([label, value]) => <Panel key={label} className="min-w-0 p-3 sm:p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold text-foreground">{number(Number(value))}</p></Panel>)}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} className="accent-[var(--accent)]" />{t("accountFavoritesOnly")}</label>
          {favoriteError ? <p role="alert" className="text-sm text-danger">{t("accountFavoriteError")}</p> : null}
          {selected ? <AccountRepositoryActivity key={selected} fullName={selected} onClose={() => setSelected(null)} /> : null}
          {compareIds.length ? <div className="flex flex-wrap items-center gap-3"><p className="text-sm text-muted-foreground">{t("accountCompareSelected").replace("{count}", number(compareIds.length))}</p><button type="button" disabled={compareIds.length < 2} onClick={() => setShowComparison(true)} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("compareRepos")}</button><button type="button" onClick={() => { setCompareIds([]); setShowComparison(false); }} className="text-xs text-muted-foreground underline">{t("closeComparison")}</button></div> : null}
          {showComparison ? <AccountComparison repositories={comparedRepositories} onClose={() => setShowComparison(false)} /> : null}
          <p className="text-sm text-muted-foreground">{t("accountLoadedScope").replace("{shown}", number(shown.length)).replace("{loaded}", number(repositories.length))}</p>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => downloadListing("csv")} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("accountExportCsv")}</button><button type="button" onClick={() => downloadListing("json")} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("accountExportJson")}</button></div>
          {loadError ? <p role="alert" className="text-sm text-danger">{t("accountLoadError")} <button type="button" onClick={() => { setLoadError(false); setLoadingMore(true); setRetryCount((current) => current + 1); }} className="underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("refresh")}</button></p> : null}
          {repositories.length === 0 ? <Panel className="p-6">{t("accountReposEmpty")}</Panel> : null}
          {repositories.length > 0 && shown.length === 0 ? <Panel className="p-6">{t("noRepositoriesFound")}</Panel> : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((repo) => (
              <Panel key={repo.id} className="min-w-0 p-4">
                <div className="flex items-start justify-between gap-2">
                  <a className="min-w-0 break-all font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]" href={`https://github.com/${repo.full_name.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noreferrer">{repo.full_name}</a>
                  <Badge variant="outline">{repo.private ? t("accountRepoPrivate") : t("accountRepoPublic")}</Badge>
                </div>
                {repo.description ? <p className="mt-2 break-words text-sm text-muted-foreground">{repo.description}</p> : null}
                <p className="mt-4 text-xs text-muted-foreground">{repo.language || "—"} · ★ {number(repo.stargazers_count)} · {t("updated")} {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(repo.updated_at))}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelected(repo.full_name)} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("repoViewActivity")}</button>
                  <button type="button" aria-pressed={compareIds.includes(repo.id)} onClick={() => { setShowComparison(false); setCompareIds((current) => current.includes(repo.id) ? current.filter((id) => id !== repo.id) : current.length < 4 ? [...current, repo.id] : current); }} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{compareIds.includes(repo.id) ? t("accountCompareRemove") : t("accountCompareAdd")}</button>
                  {!repo.private ? <a href={`/reports?${new URLSearchParams({ owner: repo.full_name.split("/")[0], repo: repo.name })}`} className="rounded-md border border-border px-3 py-1.5 text-xs text-accent focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("publicReportOpen")}</a> : null}
                  <button type="button" onClick={async () => { const wasFavorite = isFavorite(repo.id); setFavoriteError(false); const nowFavorite = await toggleFavorite(repo.id, repo.full_name); if (nowFavorite === wasFavorite) setFavoriteError(true); }} aria-pressed={isFavorite(repo.id)} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{isFavorite(repo.id) ? t("unfavorite") : t("favorite")}</button>
                </div>
              </Panel>
            ))}
          </div>
          {hasMore ? <button type="button" disabled={loadingMore} onClick={() => { setLoadingMore(true); setPage((current) => current + 1); }} className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{loadingMore ? t("accountReposLoading") : t("accountLoadMore")}</button> : null}
        </>
      ) : null}
    </div>
  );
}


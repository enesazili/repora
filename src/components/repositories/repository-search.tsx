"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { useLocale } from "@/i18n";

interface SearchRepo { id: number; full_name: string; private: boolean; language: string | null; stargazers_count: number }

export function RepositorySearch({ onSelect }: { onSelect: (fullName: string) => void }) {
  const { t, number } = useLocale();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("best-match");
  const [scope, setScope] = useState<"owned" | "accessible-private">("owned");
  const [repos, setRepos] = useState<SearchRepo[]>([]);
  const [total, setTotal] = useState(0);
  const [incomplete, setIncomplete] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error" | "rate">("idle");

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: query.trim(), page: String(page), sort, scope });
      fetch(`/api/user/repository-search?${params}`, { signal: controller.signal, cache: "no-store" })
        .then(async (response) => {
          if (response.status === 429) { setStatus("rate"); return; }
          if (!response.ok) throw new Error("search");
          const data = await response.json();
          setRepos(data.repositories);
          setTotal(data.total);
          setIncomplete(Boolean(data.incomplete));
          setStatus("ready");
        })
        .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, page, sort, scope]);

  return <Panel className="space-y-3 p-4">
    <h2 className="text-sm font-semibold text-foreground">{t("ownedSearchTitle")}</h2>
    <p className="text-xs text-muted-foreground">{t("ownedSearchScope")}</p>
    <div className="flex flex-wrap gap-2"><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setStatus(event.target.value.trim().length < 2 ? "idle" : "loading"); }} placeholder={t("searchRepositories")} aria-label={t("ownedSearchTitle")} className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]" /><select aria-label={t("ownedSearchScopeLabel")} value={scope} onChange={(event) => { setScope(event.target.value as "owned" | "accessible-private"); setPage(1); setStatus(query.trim().length < 2 ? "idle" : "loading"); }} className="rounded-md border border-border bg-surface px-2 py-2 text-xs text-foreground"><option value="owned">{t("accountOwned")}</option><option value="accessible-private">{t("ownedSearchPrivate")}</option></select><select aria-label={t("sortBy")} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); setStatus(query.trim().length < 2 ? "idle" : "loading"); }} className="rounded-md border border-border bg-surface px-2 py-2 text-xs text-foreground"><option value="best-match">{t("ownedSearchBestMatch")}</option><option value="stars">{t("sortStars")}</option><option value="forks">{t("sortForks")}</option><option value="updated">{t("sortUpdated")}</option></select></div>
    {status === "loading" ? <p role="status" className="text-xs text-muted-foreground">{t("ownedSearchLoading")}</p> : null}
    {status === "rate" ? <p role="alert" className="text-xs text-danger">{t("rateLimit")}</p> : null}
    {status === "error" ? <p role="alert" className="text-xs text-danger">{t("ownedSearchError")}</p> : null}
    {status === "ready" ? <><p className="text-xs text-muted-foreground">{t("ownedSearchCount").replace("{count}", number(total))}{incomplete || total > 1000 ? ` · ${t("ownedSearchPartial")}` : ""}</p>{repos.length ? <ul className="divide-y divide-border">{repos.map((repo) => <li key={repo.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"><span className="min-w-0 break-all text-foreground">{repo.full_name} · {repo.private ? t("accountRepoPrivate") : t("accountRepoPublic")} · {repo.language || "—"} · ★ {number(repo.stargazers_count)}</span><button type="button" onClick={() => onSelect(repo.full_name)} className="rounded-md border border-border px-2 py-1 text-accent focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{t("repoViewActivity")}</button></li>)}</ul> : <p className="text-xs text-muted-foreground">{t("noRepositoriesFound")}</p>}<div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => { setPage((current) => current - 1); setStatus("loading"); }} className="rounded-md border border-border px-2 py-1 text-xs text-foreground disabled:opacity-50">{t("ownedSearchPrevious")}</button><button type="button" disabled={page * 30 >= Math.min(total, 1000)} onClick={() => { setPage((current) => current + 1); setStatus("loading"); }} className="rounded-md border border-border px-2 py-1 text-xs text-foreground disabled:opacity-50">{t("ownedSearchNext")}</button></div></> : null}
  </Panel>;
}

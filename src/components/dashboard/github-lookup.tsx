"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { ExternalLink, Code2, LoaderCircle, Search, Star, GitFork, Users, CalendarDays } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import type { GithubAnalysis } from "@/lib/github/service";
import { useLocale } from "@/i18n";

type ErrorKey = "invalid" | "not_found" | "rate_limit" | "forbidden" | "timeout" | "upstream" | "network";
const ERROR_KEYS: Record<ErrorKey, string> = { invalid: "invalidUser", not_found: "notFound", rate_limit: "rateLimit", forbidden: "githubForbidden", timeout: "githubTimeout", upstream: "githubServerError", network: "network" };

export function GithubLookup({ onAnalysisChange }: { onAnalysisChange?: (analysis: GithubAnalysis | null) => void }) {
  const { t, number, date } = useLocale();
  const [username, setUsername] = useState("");
  const [data, setData] = useState<GithubAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setData(null); onAnalysisChange?.(null); setLoading(true);
    try {
      const response = await fetch(`/api/github/${encodeURIComponent(username.trim())}`);
      const body = await response.json();
      if (!response.ok) { setError(ERROR_KEYS[body.error as ErrorKey] ?? "apiError"); return; }
      const analysis = body as GithubAnalysis;
      setData(analysis);
      onAnalysisChange?.(analysis);
    } catch { setError("network"); }
    finally { setLoading(false); }
  }
  return <section className="space-y-4" aria-label={t("searchUser")}>
    <Panel className="overflow-hidden">
      <PanelHeader title={t("searchUser")} description={t("rateHelp")} actions={<Badge variant="accent" dot>{t("real")}</Badge>} />
      <form onSubmit={submit} className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row">
        <label className="sr-only" htmlFor="github-username">{t("username")}</label>
        <div className="relative min-w-0 flex-1"><Code2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/><input id="github-username" name="username" autoComplete="off" maxLength={39} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="octocat" className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"/></div>
        <button type="submit" disabled={loading || !username.trim()} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-accent px-4 text-xs font-medium text-accent-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true"/> : <Search className="size-4" aria-hidden="true"/>}{loading ? t("analyzing") : t("analyze")}</button>
      </form>
      {error ? <p role="alert" className="border-t border-border bg-danger-muted px-4 py-3 text-xs text-danger">{t(error as keyof typeof import("@/i18n").MESSAGES.en)}</p> : null}
    </Panel>
    {data ? <AnalysisResults data={data} number={number} date={date} t={t}/> : null}
  </section>;
}

function AnalysisResults({ data, number, date, t }: { data: GithubAnalysis; number: (n: number) => string; date: (d: string) => string; t: ReturnType<typeof useLocale>["t"] }) {
  const profile = data.profile;
  return <div className="space-y-4" aria-live="polite">
    <Panel className="overflow-hidden">
      <PanelHeader title={t("profile")} description={t("createdHelp")} actions={<Badge variant="accent" dot>{t("real")}</Badge>}/>
      <div className="flex flex-wrap items-center gap-4 border-t border-border p-4">
        <Image src={profile.avatar_url} alt="" width={56} height={56} unoptimized referrerPolicy="no-referrer" className="size-14 rounded-full border border-border"/>
        <div className="min-w-0 flex-1"><h2 className="truncate text-base font-semibold text-foreground">{profile.name || profile.login}</h2><p className="text-xs text-muted-foreground">@{profile.login}</p>{profile.bio ? <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{profile.bio}</p> : null}</div>
        <a href={profile.html_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">{t("profileLink")}<ExternalLink className="size-3"/></a>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border sm:grid-cols-4 sm:divide-y-0">
        <MiniStat label={t("publicRepos")} value={number(data.stats.repositories)} icon={<Code2 className="size-3.5"/>}/><MiniStat label={t("stars")} value={number(data.stats.stars)} icon={<Star className="size-3.5"/>}/><MiniStat label={t("followers")} value={number(profile.followers)} icon={<Users className="size-3.5"/>}/><MiniStat label={t("following")} value={number(profile.following)} icon={<Users className="size-3.5"/>}/>
      </div>
      <p className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-[10px] text-muted-foreground"><CalendarDays className="size-3"/>{t("created")}: {date(profile.created_at)}</p>
    </Panel>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
      <Panel className="overflow-hidden"><PanelHeader title={t("topRepositories")} description={t("repositoriesHelp")}/>{data.repositoryCoverage.limited ? <p className="border-t border-border bg-warning-muted px-4 py-2 text-[10px] text-foreground">{t("repositoryCoverage").replace("{shown}", number(data.repositoryCoverage.fetched)).replace("{total}", number(data.repositoryCoverage.total))}</p> : null}{data.repositories.length ? <div className="divide-y divide-border">{data.repositories.slice(0, 8).map((repo) => <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-start gap-3 px-4 py-3 hover:bg-surface-secondary"><Code2 className="mt-0.5 size-4 shrink-0 text-muted-foreground"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-accent">{repo.full_name}</p>{repo.description ? <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{repo.description}</p> : null}<p className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">{repo.language ? <span>{repo.language}</span> : null}<span className="inline-flex items-center gap-1"><Star className="size-3"/>{number(repo.stargazers_count)}</span><span className="inline-flex items-center gap-1"><GitFork className="size-3"/>{number(repo.forks_count)}</span><span>{t("created")}: {date(repo.created_at)}</span><span>{t("updated")}: {date(repo.updated_at)}</span>{repo.archived ? <span>{t("archived")}</span> : null}{repo.fork ? <span>{t("fork")}</span> : null}</p></div></a>)}</div> : <p className="border-t border-border p-4 text-xs text-muted-foreground">{t("repositories")} · 0</p>}</Panel>
      <div className="space-y-4"><Panel className="overflow-hidden"><PanelHeader title={t("languageMix")} description={t("language")}/><div className="space-y-3 border-t border-border p-4">{data.languages.length ? data.languages.slice(0, 8).map((item) => <div key={item.name}><div className="mb-1 flex justify-between text-[11px]"><span className="text-foreground">{item.name}</span><span className="text-muted-foreground">{item.repositories} · {item.percent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{width:`${item.percent}%`}}/></div></div>) : <p className="text-xs text-muted-foreground">{t("noLanguage")}</p>}</div></Panel>
      <Panel className="overflow-hidden"><PanelHeader title={t("events")} description={t("eventsScope")}/>{data.events.length ? <ul className="divide-y divide-border border-t border-border">{data.events.slice(0, 6).map((event) => <li key={event.id} className="px-4 py-2"><p className="text-[11px] text-foreground">{eventLabel(event.type, t)} · {event.repo.name}</p><time className="text-[10px] text-muted-foreground">{date(event.created_at)}</time></li>)}</ul> : <p className="border-t border-border p-4 text-xs text-muted-foreground">{t("noActivity")}</p>}</Panel></div>
    </div>
    <p className="text-[10px] text-muted-foreground">{t("contributionsNote")}</p>
  </div>;
}
function eventLabel(type: string, t: ReturnType<typeof useLocale>["t"]) {
  const eventKeys: Record<string, string> = { PushEvent: "eventPush", PullRequestEvent: "eventPullRequest", IssuesEvent: "eventIssues", WatchEvent: "eventWatch", ReleaseEvent: "eventRelease", CreateEvent: "eventCreate", ForkEvent: "eventFork" };
  const key = eventKeys[type] ?? "eventOther";
  return t(key as keyof typeof import("@/i18n").MESSAGES.en);
}
function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="px-4 py-3"><div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-[10px]">{label}</span></div><p className="mt-1 text-base font-semibold text-foreground">{value}</p></div>; }

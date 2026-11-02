"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/i18n";

interface Workflow {
  pullRequests: { number: number; title: string; state: string; createdAt: string; mergedAt: string | null }[];
  issues: { number: number; title: string; state: string; createdAt: string; closedAt: string | null; labels: string[] }[];
  pullLimitReached: boolean;
  issueLimitReached: boolean;
  releases: { id: number; name: string; publishedAt: string }[];
  releaseLimitReached: boolean;
  releasesUnavailable: boolean;
}

export function RepositoryWorkflow({ fullName }: { fullName: string }) {
  const { t, number, date } = useLocale();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "expired">("loading");
  const [trendRange, setTrendRange] = useState<30 | 90>(30);

  useEffect(() => {
    const controller = new AbortController();
    const [owner, repo] = fullName.split("/");
    fetch(`/api/user/repository-workflow?${new URLSearchParams({ owner, repo })}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) { setStatus("expired"); return; }
        if (!response.ok) throw new Error("upstream");
        setWorkflow(await response.json());
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [fullName]);

  const metrics = useMemo(() => {
    if (!workflow) return null;
    const pulls = workflow.pullRequests;
    const issues = workflow.issues;
    const mergeDays = pulls.filter((pull) => pull.mergedAt).map((pull) => (Date.parse(pull.mergedAt!) - Date.parse(pull.createdAt)) / 86400000).filter((days) => Number.isFinite(days) && days >= 0).sort((a, b) => a - b);
    const middle = Math.floor(mergeDays.length / 2);
    const medianMergeDays = mergeDays.length ? mergeDays.length % 2 ? mergeDays[middle] : (mergeDays[middle - 1] + mergeDays[middle]) / 2 : null;
    const labels = new Map<string, number>();
    for (const issue of issues) for (const label of issue.labels) labels.set(label, (labels.get(label) || 0) + 1);
    return {
      openPulls: pulls.filter((pull) => pull.state === "open").length,
      mergedPulls: pulls.filter((pull) => pull.mergedAt).length,
      closedPulls: pulls.filter((pull) => pull.state === "closed" && !pull.mergedAt).length,
      openIssues: issues.filter((issue) => issue.state === "open").length,
      closedIssues: issues.filter((issue) => issue.state === "closed").length,
      medianMergeDays,
      labels: [...labels].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [workflow]);

  const trend = useMemo(() => {
    if (!workflow) return [];
    const first = new Date();
    first.setUTCHours(0, 0, 0, 0);
    first.setUTCDate(first.getUTCDate() - (trendRange - 1));
    const weeks = new Map<string, { createdPr: number; mergedPr: number; createdIssue: number; resolvedIssue: number }>();
    for (let offset = 0; offset < trendRange; offset++) {
      const day = new Date(first);
      day.setUTCDate(day.getUTCDate() + offset);
      day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
      weeks.set(day.toISOString().slice(0, 10), { createdPr: 0, mergedPr: 0, createdIssue: 0, resolvedIssue: 0 });
    }
    function count(value: string | null, key: "createdPr" | "mergedPr" | "createdIssue" | "resolvedIssue") {
      if (!value || Number.isNaN(Date.parse(value)) || Date.parse(value) < first.getTime()) return;
      const day = new Date(value);
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
      const bucket = weeks.get(day.toISOString().slice(0, 10));
      if (bucket) bucket[key]++;
    }
    for (const pull of workflow.pullRequests) { count(pull.createdAt, "createdPr"); count(pull.mergedAt, "mergedPr"); }
    for (const issue of workflow.issues) { count(issue.createdAt, "createdIssue"); count(issue.closedAt, "resolvedIssue"); }
    return [...weeks].map(([week, counts]) => ({ week, ...counts }));
  }, [workflow, trendRange]);

  return <section className="space-y-3 border-t border-border pt-5" aria-label={t("workflowTitle")}>
    <h3 className="text-sm font-semibold text-foreground">{t("workflowTitle")}</h3>
    <p className="text-xs text-muted-foreground">{t("workflowScope")}</p>
    {status === "loading" ? <p role="status" className="text-sm text-muted-foreground">{t("workflowLoading")}</p> : null}
    {status === "expired" ? <p role="alert" className="text-sm text-danger">{t("accountReposExpired")}</p> : null}
    {status === "error" ? <p role="alert" className="text-sm text-danger">{t("workflowError")}</p> : null}
    {status === "ready" && workflow && metrics ? <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[[t("workflowOpenPr"), metrics.openPulls], [t("workflowMergedPr"), metrics.mergedPulls], [t("workflowClosedPr"), metrics.closedPulls], [t("workflowOpenIssues"), metrics.openIssues], [t("workflowClosedIssues"), metrics.closedIssues]].map(([label, value]) => <div key={label} className="rounded-md border border-border bg-surface-secondary p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold text-foreground">{number(Number(value))}</p></div>)}
        <div className="rounded-md border border-border bg-surface-secondary p-3"><p className="text-xs text-muted-foreground">{t("workflowMedianMerge")}</p><p className="mt-1 text-lg font-semibold text-foreground">{metrics.medianMergeDays === null ? "—" : number(Math.round(metrics.medianMergeDays))}</p></div>
      </div>
      {workflow.pullLimitReached || workflow.issueLimitReached ? <p className="text-xs text-warning">{t("workflowSampleLimit")}</p> : null}
      <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-semibold text-foreground">{t("workflowTrendTitle")}</h4><label className="text-xs text-muted-foreground">{t("commitRange")}<select value={trendRange} onChange={(event) => setTrendRange(Number(event.target.value) as 30 | 90)} className="ml-2 rounded-md border border-border bg-surface px-2 py-1 text-foreground"><option value="30">{t("commit30Days")}</option><option value="90">{t("commit90Days")}</option></select></label></div><p className="text-xs text-muted-foreground">{t("workflowTrendScope")}</p><div className="overflow-x-auto"><table className="w-full min-w-96 text-left text-xs"><thead><tr className="border-b border-border text-muted-foreground"><th className="py-2 font-medium">{t("commitWeekly")}</th><th className="py-2 font-medium">{t("workflowCreatedPr")}</th><th className="py-2 font-medium">{t("workflowMergedPr")}</th><th className="py-2 font-medium">{t("workflowCreatedIssues")}</th><th className="py-2 font-medium">{t("workflowResolvedIssues")}</th></tr></thead><tbody>{trend.map((item) => <tr key={item.week} className="border-b border-border text-foreground"><th scope="row" className="py-2 font-medium">{date(item.week)}</th><td>{number(item.createdPr)}</td><td>{number(item.mergedPr)}</td><td>{number(item.createdIssue)}</td><td>{number(item.resolvedIssue)}</td></tr>)}</tbody></table></div></div>
      <div className="grid gap-5 md:grid-cols-2">
        <div><h4 className="text-xs font-semibold text-foreground">{t("workflowRecentPr")}</h4><ul className="mt-2 divide-y divide-border">{workflow.pullRequests.slice(0, 5).map((pull) => <li key={pull.number} className="py-2 text-xs"><p className="break-words text-foreground">#{number(pull.number)} {pull.title}</p><p className="text-muted-foreground">{pull.mergedAt ? t("workflowMergedPr") : pull.state === "open" ? t("workflowOpenPr") : t("workflowClosedPr")} · {date(pull.createdAt)}</p></li>)}</ul>{workflow.pullRequests.length === 0 ? <p className="text-xs text-muted-foreground">{t("workflowNoPr")}</p> : null}</div>
        <div><h4 className="text-xs font-semibold text-foreground">{t("workflowRecentIssues")}</h4><ul className="mt-2 divide-y divide-border">{workflow.issues.slice(0, 5).map((issue) => <li key={issue.number} className="py-2 text-xs"><p className="break-words text-foreground">#{number(issue.number)} {issue.title}</p><p className="text-muted-foreground">{issue.state === "open" ? t("workflowOpenIssues") : t("workflowClosedIssues")} · {date(issue.createdAt)}</p></li>)}</ul>{workflow.issues.length === 0 ? <p className="text-xs text-muted-foreground">{t("workflowNoIssues")}</p> : null}</div>
      </div>
      <div className="space-y-2"><h4 className="text-xs font-semibold text-foreground">{t("releaseSampleTitle")}</h4><p className="text-xs text-muted-foreground">{t("releaseSampleScope")}</p>{workflow.releasesUnavailable ? <p className="text-xs text-warning">{t("releaseUnavailable")}</p> : workflow.releases.length ? <ul className="divide-y divide-border">{workflow.releases.slice(0, 5).map((release) => <li key={release.id} className="flex flex-wrap justify-between gap-2 py-2 text-xs text-foreground"><span className="break-all">{release.name}</span><span className="text-muted-foreground">{date(release.publishedAt)}</span></li>)}</ul> : <p className="text-xs text-muted-foreground">{t("releaseEmpty")}</p>}{workflow.releaseLimitReached ? <p className="text-xs text-warning">{t("releaseLimit")}</p> : null}</div>
      {metrics.labels.length ? <div><h4 className="text-xs font-semibold text-foreground">{t("workflowTopLabels")}</h4><div className="mt-2 flex flex-wrap gap-2">{metrics.labels.map(([label, count]) => <span key={label} className="rounded-full border border-border px-2 py-1 text-xs text-foreground">{label} · {number(count)}</span>)}</div></div> : null}
    </> : null}
  </section>;
}

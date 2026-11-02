"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n";

interface Report { name: string; description: string | null; htmlUrl: string; language: string | null; stars: number; forks: number; openIssues: number; createdAt: string; updatedAt: string; fetchedAt: string; archived: boolean }

export default function ReportsPage() {
  const { t, number, date } = useLocale();
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "private">("loading");
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
    fetch(`/api/report?${new URLSearchParams({ owner: params.get("owner") || "", repo: params.get("repo") || "" })}`, { signal: controller.signal })
      .then(async (response) => { if (response.status === 404) { setStatus("private"); return; } if (!response.ok) throw new Error("report"); setReport(await response.json()); setStatus("ready"); })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, []);
  return <main className="mx-auto min-h-screen max-w-3xl space-y-6 bg-background px-4 py-10 text-foreground sm:px-6">
    <header className="border-b border-border pb-5"><Link href="/" className="text-sm font-semibold text-accent">Repora</Link><h1 className="mt-3 text-2xl font-semibold">{t("publicReportTitle")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("publicReportScope")}</p></header>
    {status === "loading" ? <p role="status">{t("publicReportLoading")}</p> : null}
    {status === "error" ? <p role="alert" className="text-danger">{t("publicReportError")}</p> : null}
    {status === "private" ? <p role="alert" className="text-danger">{t("publicReportUnavailable")}</p> : null}
    {status === "ready" && report ? <article className="space-y-5"><div><h2 className="break-all text-xl font-semibold">{report.name}</h2>{report.description ? <p className="mt-2 text-sm text-muted-foreground">{report.description}</p> : null}<p className="mt-2 text-xs text-muted-foreground">{t("publicReportFetched")} {date(report.fetchedAt)}</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[[t("stars"), report.stars], [t("forks"), report.forks], [t("openIssues"), report.openIssues], [t("language"), report.language || "—"]].map(([label, value]) => <div key={label} className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{typeof value === "number" ? number(value) : value}</p></div>)}</div><dl className="space-y-2 text-sm"><div className="flex justify-between border-b border-border py-2"><dt>{t("created")}</dt><dd>{date(report.createdAt)}</dd></div><div className="flex justify-between border-b border-border py-2"><dt>{t("updated")}</dt><dd>{date(report.updatedAt)}</dd></div></dl><p className="text-xs text-muted-foreground">{t("publicReportDefinitions")}</p><div className="flex gap-3 print:hidden"><a href={report.htmlUrl} target="_blank" rel="noreferrer" className="rounded-md border border-border px-3 py-2 text-sm text-accent">{t("viewOnGithub")}</a><button type="button" onClick={() => window.print()} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">{t("publicReportPrint")}</button></div></article> : null}
  </main>;
}

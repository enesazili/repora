"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n";

interface Report { name: string; language: string | null; stars: number; forks: number; openIssues: number; updatedAt: string; fetchedAt: string }

export default function PublicComparisonPage() {
  const { t, number, date } = useLocale();
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "private">("loading");
  useEffect(() => {
    const controller = new AbortController();
    const repos = new URLSearchParams(window.location.search).get("repos") || "";
    fetch(`/api/report/comparison?${new URLSearchParams({ repos })}`, { signal: controller.signal })
      .then(async (response) => { if (response.status === 404) { setStatus("private"); return; } if (!response.ok) throw new Error("report"); const data = await response.json(); setReports(data.reports); setStatus("ready"); })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, []);
  const maxStars = Math.max(1, ...reports.map((report) => report.stars));
  function download(format: "csv" | "json") {
    const rows = reports.map((report) => ({ name: report.name, stars: report.stars, forks: report.forks, openIssues: report.openIssues, language: report.language || "", updatedAt: report.updatedAt }));
    const cell = (value: string | number) => { const safe = /^[=+@\-\t\r]/.test(String(value)) ? `'${value}` : String(value); return `"${safe.replaceAll('"', '""')}"`; };
    const content = format === "json" ? JSON.stringify({ source: "public-github-api", fetchedAt: reports[0]?.fetchedAt, repositories: rows }, null, 2) : [["name", "stars", "forks", "openIssues", "language", "updatedAt"].map(cell).join(","), ...rows.map((row) => Object.values(row).map(cell).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `repora-public-comparison.${format}`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="mx-auto min-h-screen max-w-5xl space-y-6 bg-background px-4 py-10 text-foreground sm:px-6"><header className="border-b border-border pb-5"><Link href="/" className="text-sm font-semibold text-accent">Repora</Link><h1 className="mt-3 text-2xl font-semibold">{t("publicComparisonTitle")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("publicReportScope")}</p></header>
    {status === "loading" ? <p role="status">{t("publicReportLoading")}</p> : null}{status === "private" ? <p role="alert" className="text-danger">{t("publicReportUnavailable")}</p> : null}{status === "error" ? <p role="alert" className="text-danger">{t("publicReportError")}</p> : null}
    {status === "ready" ? <><p className="text-xs text-muted-foreground">{t("publicReportFetched")} {date(reports[0].fetchedAt)} · {t("publicComparisonScope")}</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{reports.map((report) => <section key={report.name} className="min-w-0 rounded-md border border-border p-4"><h2 className="break-all text-sm font-semibold">{report.name}</h2><p className="mt-1 text-xs text-muted-foreground">{report.language || "—"}</p><dl className="mt-4 space-y-2 text-sm">{[[t("stars"), report.stars], [t("forks"), report.forks], [t("openIssues"), report.openIssues]].map(([label, value]) => <div key={label} className="flex justify-between gap-2"><dt>{label}</dt><dd>{number(Number(value))}</dd></div>)}</dl><div className="mt-4 h-2 rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${report.stars / maxStars * 100}%` }} /></div><p className="mt-1 text-[10px] text-muted-foreground">{t("accountCompareStarsRelative")}</p><p className="mt-3 text-xs text-muted-foreground">{t("updated")} {date(report.updatedAt)}</p></section>)}</div><div className="flex flex-wrap gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-md border border-border px-3 py-2 text-xs">{t("publicReportPrint")}</button><button type="button" onClick={() => download("csv")} className="rounded-md border border-border px-3 py-2 text-xs">CSV</button><button type="button" onClick={() => download("json")} className="rounded-md border border-border px-3 py-2 text-xs">JSON</button></div></> : null}
  </main>;
}

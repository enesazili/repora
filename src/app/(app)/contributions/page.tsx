"use client";

import { useState } from "react";
import { useLocale } from "@/i18n";
import { useRepositoryPages } from "@/components/dashboard/use-repository-pages";
import { AccountRepositoryActivity } from "@/components/repositories/account-repository-activity";
import { Panel } from "@/components/ui/panel";

export default function ContributionsPage({ titleKey = "contributions" }: { titleKey?: "contributions" | "activity" }) {
  const { t, number } = useLocale();
  const { repositories, hasMore, status, loadMore } = useRepositoryPages();
  const [selected, setSelected] = useState("");
  return <div className="space-y-6"><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{t("analytics")}</p><h1 className="mt-2 text-2xl font-semibold text-foreground">{t(titleKey)}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("contributionsActualScope")}</p></div>
    <Panel className="space-y-3 p-5"><label className="block text-sm font-medium text-foreground">{t("dashboardChooseFavorite")}<select value={selected} onChange={(event) => setSelected(event.target.value)} className="mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]"><option value="">{t("contributionsChooseRepo")}</option>{repositories.map((repo) => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}</select></label><p className="text-sm text-muted-foreground">{t("accountDashboardSample")} · {t("accountRepoCount")}: {number(repositories.length)}</p>{hasMore ? <button type="button" disabled={status === "loading"} onClick={loadMore} className="rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50">{t("ownedSearchNext")}</button> : null}</Panel>
    {status === "loading" ? <p role="status" className="text-sm text-muted-foreground">{t("accountReposLoading")}</p> : null}{status === "error" ? <p role="alert" className="text-sm text-danger">{t("accountReposError")}</p> : null}{status === "expired" ? <p role="alert" className="text-sm text-danger">{t("accountReposExpired")}</p> : null}{status === "ready" && repositories.length === 0 ? <p className="text-sm text-muted-foreground">{t("accountReposEmpty")}</p> : null}
    {selected ? <AccountRepositoryActivity key={selected} fullName={selected} onClose={() => setSelected("")} /> : null}
  </div>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/providers/auth-provider";
import { useLocale } from "@/i18n";
import type { AccountRepository } from "@/lib/github/authenticated";
import { parseDashboardLayout } from "@/lib/dashboard-layout";
import { AccountRepositoryActivity } from "@/components/repositories/account-repository-activity";

export function AuthenticatedOverview() {
  const { user, favorites, preferences } = useAuth();
  const { t, number, date } = useLocale();
  const [repositories, setRepositories] = useState<AccountRepository[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "expired" | "error">(
    "loading",
  );
  const [hasMore, setHasMore] = useState(false);

  const layout = useMemo(
    () => parseDashboardLayout(preferences?.widget_config),
    [preferences?.widget_config],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      "/api/user/repositories?page=1&affiliation=owner&visibility=all&sort=updated",
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          setStatus("expired");
          return;
        }
        if (!response.ok) throw new Error("upstream");
        const data = await response.json();
        setRepositories(data.repositories);
        setHasMore(Boolean(data.hasMore));
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const summary = useMemo(() => {
    const privateCount = repositories.filter((repo) => repo.private).length;
    const stars = repositories.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0,
    );
    const forks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
    const languages = new Map<string, number>();
    for (const repo of repositories) {
      if (repo.language) {
        languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
      }
    }
    return {
      privateCount,
      stars,
      forks,
      languages: [...languages].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [repositories]);

  const selectedFavorite =
    favorites.find(
      (favorite) => favorite.repo_full_name === layout.repository,
    )?.repo_full_name || favorites[0]?.repo_full_name;

  const statCards = [
    [t("accountRepoCount"), repositories.length],
    [t("accountPrivateCount"), summary.privateCount],
    [t("stars"), summary.stars],
    [t("forks"), summary.forks],
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("workspace")}
        title={t("accountDashboardTitle").replace(
          "{name}",
          user?.name || user?.login || "GitHub",
        )}
        description={t("accountDashboardDescription")}
      />

      {status === "loading" ? (
        <Panel role="status" className="p-6 text-sm text-muted-foreground">
          {t("accountReposLoading")}
        </Panel>
      ) : null}
      {status === "expired" ? (
        <Panel role="alert" className="p-6 text-sm text-danger">
          {t("accountReposExpired")}
        </Panel>
      ) : null}
      {status === "error" ? (
        <Panel role="alert" className="p-6 text-sm text-danger">
          {t("accountReposError")}
        </Panel>
      ) : null}

      {status === "ready" ? (
        <>
          <p className="text-xs text-muted-foreground">
            {hasMore ? t("accountDashboardSample") : t("accountDashboardComplete")}
          </p>

          {repositories.length === 0 ? (
            <Panel className="p-6 text-sm text-muted-foreground">
              {t("accountReposEmpty")}
            </Panel>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {!layout.hidden.includes("summary") ? (
                <div
                  style={{ order: layout.order.indexOf("summary") }}
                  className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-4"
                >
                  {statCards.map(([label, value]) => (
                    <Panel key={label} className="min-w-0 p-4">
                      <p className="truncate text-xs text-muted-foreground">{label}</p>
                      <p className="tnum mt-2 text-2xl font-semibold text-foreground">
                        {number(Number(value))}
                      </p>
                    </Panel>
                  ))}
                </div>
              ) : null}

              {!layout.hidden.includes("recent") ? (
                <Panel
                  style={{ order: layout.order.indexOf("recent") }}
                  className="min-w-0 p-5"
                >
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("accountRecentlyUpdated")}
                  </h2>
                  <ul className="mt-3 divide-y divide-border">
                    {repositories.slice(0, 5).map((repo) => (
                      <li
                        key={repo.id}
                        className="flex min-w-0 items-center justify-between gap-3 py-2 text-xs"
                      >
                        <span className="min-w-0 truncate text-foreground">
                          {repo.full_name}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {date(repo.updated_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/repositories"
                    className="mt-3 inline-block text-xs font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                  >
                    {t("allRepositories")}
                  </Link>
                </Panel>
              ) : null}

              {!layout.hidden.includes("languages") ? (
                <Panel
                  style={{ order: layout.order.indexOf("languages") }}
                  className="min-w-0 p-5"
                >
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("languageMix")}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {summary.languages.map(([language, count]) => (
                      <li
                        key={language}
                        className="flex min-w-0 justify-between gap-2 text-xs text-foreground"
                      >
                        <span className="min-w-0 truncate">{language}</span>
                        <span className="tnum shrink-0">{number(count)}</span>
                      </li>
                    ))}
                  </ul>
                  {summary.languages.length === 0 ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("noLanguage")}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("accountLanguageScope")}
                  </p>
                </Panel>
              ) : null}

              {!layout.hidden.includes("favorites") ? (
                <Panel
                  style={{ order: layout.order.indexOf("favorites") }}
                  className="min-w-0 p-5 lg:col-span-2"
                >
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("accountFavoriteCount")}
                  </h2>
                  {favorites.length ? (
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {favorites.slice(0, 6).map((repo) => (
                        <li
                          key={repo.repo_id}
                          className="min-w-0 truncate rounded-md border border-border px-3 py-2 text-xs text-foreground"
                        >
                          {repo.repo_full_name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("accountNoFavorites")}
                    </p>
                  )}
                </Panel>
              ) : null}

              {!layout.hidden.includes("activity") ? (
                <div
                  style={{ order: layout.order.indexOf("activity") }}
                  className="min-w-0 space-y-3 lg:col-span-2"
                >
                  <Panel className="min-w-0 p-4">
                    <h2 className="text-sm font-semibold text-foreground">
                      {t("dashboardRepoActivity")}
                    </h2>
                    {selectedFavorite ? (
                      <p className="mt-2 min-w-0 truncate text-xs text-foreground">
                        {selectedFavorite}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("accountNoFavorites")}
                      </p>
                    )}
                    <Link
                      href="/settings#dashboard-settings"
                      className="mt-2 inline-block text-xs font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                    >
                      {t("dashboardFeaturedHint")}
                    </Link>
                  </Panel>
                  {selectedFavorite ? (
                    <AccountRepositoryActivity
                      key={selectedFavorite}
                      fullName={selectedFavorite}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

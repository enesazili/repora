"use client";

import { useEffect, useState } from "react";
import type { AccountRepository } from "@/lib/github/authenticated";

export function useRepositoryPages() {
  const [repositories, setRepositories] = useState<AccountRepository[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "expired">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/user/repositories?${new URLSearchParams({ page: String(page), affiliation: "all", visibility: "all", sort: "updated" })}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) { setStatus("expired"); return; }
        if (!response.ok) throw new Error("repositories");
        const data: { repositories: AccountRepository[]; hasMore: boolean } = await response.json();
        setRepositories((previous) => page === 1 ? data.repositories : [...previous, ...data.repositories.filter((repo) => !previous.some((item) => item.id === repo.id))]);
        setHasMore(data.hasMore);
        setStatus("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [page]);

  return { repositories, hasMore, status, loadMore: () => { setStatus("loading"); setPage((current) => current + 1); } };
}

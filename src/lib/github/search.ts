import type { AccountRepository } from "./authenticated";

export async function searchOwnedRepositories(token: string, login: string, term: string, page: number, sort: "best-match" | "stars" | "forks" | "updated", scope: "owned" | "accessible-private" = "owned"): Promise<{ repositories: AccountRepository[]; total: number; incomplete: boolean }> {
  if (!/^[a-z\d-]{1,39}$/i.test(login) || !Number.isInteger(page) || page < 1 || page > 34 || term.length < 2 || term.length > 80) throw new Error("invalid");
  const safe = term.replace(/[^\p{L}\p{N}._ -]/gu, " ").trim().replace(/\s+/g, " ");
  if (safe.length < 2) throw new Error("invalid");
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", `"${safe}" in:name,description ${scope === "owned" ? `user:${login}` : "is:private"}`);
  url.searchParams.set("per_page", "30");
  url.searchParams.set("page", String(page));
  if (sort !== "best-match") url.searchParams.set("sort", sort);
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "User-Agent": "Repora-App", "X-GitHub-Api-Version": "2022-11-28" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(response.status === 401 ? "expired" : response.status === 403 ? "rate_limit" : "upstream");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !Array.isArray((data as { items?: unknown }).items)) throw new Error("upstream");
  const result = data as { items: AccountRepository[]; total_count?: number; incomplete_results?: boolean };
  const repositories = result.items.filter((repo) => scope === "owned" ? repo.full_name?.split("/")[0]?.toLowerCase() === login.toLowerCase() : repo.private === true).slice(0, 30).map((repo) => ({ id: repo.id, full_name: repo.full_name, name: repo.name, description: repo.description, private: repo.private, html_url: repo.html_url, language: repo.language, stargazers_count: repo.stargazers_count, forks_count: repo.forks_count, open_issues_count: repo.open_issues_count, updated_at: repo.updated_at, archived: repo.archived, fork: repo.fork, default_branch: repo.default_branch }));
  return { repositories, total: Math.max(0, Number(result.total_count) || 0), incomplete: Boolean(result.incomplete_results) };
}

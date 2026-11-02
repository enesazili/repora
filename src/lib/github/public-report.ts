import { validRepositoryPath } from "./authenticated.ts";

export async function getPublicRepositoryReport(owner: string, repo: string) {
  if (!validRepositoryPath(owner, repo)) throw new Error("invalid");
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "Repora-App", "X-GitHub-Api-Version": "2022-11-28" }, next: { revalidate: 120 }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(response.status === 404 ? "not_found" : response.status === 403 || response.status === 429 ? "rate_limit" : "upstream");
  const data = await response.json();
  if (data.private !== false || data.visibility === "private") throw new Error("not_found");
  return { name: String(data.full_name), description: data.description ? String(data.description) : null, htmlUrl: `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, language: data.language ? String(data.language) : null, stars: Number(data.stargazers_count) || 0, forks: Number(data.forks_count) || 0, openIssues: Number(data.open_issues_count) || 0, createdAt: String(data.created_at), updatedAt: String(data.updated_at), archived: Boolean(data.archived), fetchedAt: new Date().toISOString() };
}

export async function getPublicComparisonReports(raw: string) {
  const names = raw.split(",");
  if (raw.length > 560 || names.length < 2 || names.length > 4 || new Set(names.map((name) => name.toLowerCase())).size !== names.length || names.some((name) => { const parts = name.split("/"); return parts.length !== 2 || !validRepositoryPath(parts[0], parts[1]); })) throw new Error("invalid");
  return Promise.all(names.map((name) => { const [owner, repo] = name.split("/"); return getPublicRepositoryReport(owner, repo); }));
}

export interface AccountRepository {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  archived: boolean;
  fork: boolean;
  default_branch: string;
}

const ownerPattern = /^(?!-)[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const repoPattern = /^[a-z\d._-]{1,100}$/i;

export function validRepositoryPath(owner: string, repo: string): boolean {
  return ownerPattern.test(owner) && repoPattern.test(repo) && repo !== "." && repo !== "..";
}

export interface RepositoryActivity {
  commits: { sha: string; message: string; date: string; author: string | null }[];
  languages: { name: string; bytes: number }[];
  totalLanguageBytes: number;
  commitLimitReached: boolean;
  page: number;
}

export interface RepositoryWorkflow {
  pullRequests: { number: number; title: string; state: string; createdAt: string; closedAt: string | null; mergedAt: string | null }[];
  issues: { number: number; title: string; state: string; createdAt: string; closedAt: string | null; labels: string[] }[];
  pullLimitReached: boolean;
  issueLimitReached: boolean;
  releases: { id: number; name: string; publishedAt: string }[];
  releaseLimitReached: boolean;
  releasesUnavailable: boolean;
}

export async function getRepositoryWorkflow(token: string, owner: string, repo: string): Promise<RepositoryWorkflow> {
  if (!validRepositoryPath(owner, repo)) throw new Error("invalid");
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const options = {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "User-Agent": "Repora-App", "X-GitHub-Api-Version": "2022-11-28" },
    cache: "no-store" as const,
    signal: AbortSignal.timeout(8000),
  };
  const [pullResponse, issueResponse, releaseResponse] = await Promise.all([
    fetch(`${base}/pulls?state=all&sort=updated&direction=desc&per_page=100`, options),
    fetch(`${base}/issues?state=all&sort=updated&direction=desc&per_page=100`, options),
    fetch(`${base}/releases?per_page=30`, options).catch(() => null),
  ]);
  const failed = [pullResponse, issueResponse].find((response) => !response.ok);
  if (failed) throw new Error(failed.status === 401 ? "expired" : failed.status === 403 ? "forbidden" : failed.status === 404 ? "not_found" : "upstream");
  const pullData: unknown = await pullResponse.json();
  const issueData: unknown = await issueResponse.json();
  if (!Array.isArray(pullData) || !Array.isArray(issueData)) throw new Error("upstream");
  const pullRequests = pullData.slice(0, 100).map((item: { number: number; title: string; state: string; created_at: string; closed_at: string | null; merged_at: string | null }) => ({ number: item.number, title: String(item.title || "").slice(0, 300), state: item.state, createdAt: item.created_at, closedAt: item.closed_at, mergedAt: item.merged_at }));
  const issues = issueData.filter((item) => !item.pull_request).slice(0, 100).map((item: { number: number; title: string; state: string; created_at: string; closed_at: string | null; labels?: { name: string }[] }) => ({ number: item.number, title: String(item.title || "").slice(0, 300), state: item.state, createdAt: item.created_at, closedAt: item.closed_at, labels: Array.isArray(item.labels) ? item.labels.map((label) => String(label.name || "")).slice(0, 10) : [] }));
  const releaseData: unknown = releaseResponse?.ok ? await releaseResponse.json().catch(() => null) : null;
  const releases = Array.isArray(releaseData) ? releaseData.slice(0, 30).filter((item) => Number.isSafeInteger(item.id) && typeof item.published_at === "string" && !Number.isNaN(Date.parse(item.published_at))).map((item) => ({ id: item.id as number, name: String(item.name || item.tag_name || "").slice(0, 160), publishedAt: item.published_at as string })) : [];
  return { pullRequests, issues, pullLimitReached: pullData.length >= 100, issueLimitReached: issueData.length >= 100, releases, releaseLimitReached: Array.isArray(releaseData) && releaseData.length >= 30, releasesUnavailable: !Array.isArray(releaseData) };
}

export async function getRepositoryActivity(token: string, owner: string, repo: string, rangeDays: 30 | 90 = 30, page = 1): Promise<RepositoryActivity> {
  if (!validRepositoryPath(owner, repo)) throw new Error("invalid");
  if (![30, 90].includes(rangeDays) || !Number.isInteger(page) || page < 1 || page > 10) throw new Error("invalid");
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (rangeDays - 1));
  const commitUrl = new URL(`${base}/commits`);
  commitUrl.searchParams.set("per_page", "100");
  commitUrl.searchParams.set("page", String(page));
  commitUrl.searchParams.set("since", since.toISOString());
  const options = {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Repora-App",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store" as const,
    signal: AbortSignal.timeout(8000),
  };
  const [commitResponse, languageResponse] = await Promise.all([
    fetch(commitUrl, options),
    page === 1 ? fetch(`${base}/languages`, options) : Promise.resolve(null),
  ]);
  const failed = [commitResponse, languageResponse].find((response) => response && !response.ok && !(response === commitResponse && response.status === 409));
  if (failed) throw new Error(failed.status === 401 ? "expired" : failed.status === 403 ? "forbidden" : failed.status === 404 ? "not_found" : "upstream");
  const commitData: unknown = commitResponse.status === 409 ? [] : await commitResponse.json();
  const languageData: unknown = languageResponse ? await languageResponse.json() : {};
  if (!Array.isArray(commitData) || !languageData || typeof languageData !== "object" || Array.isArray(languageData)) throw new Error("upstream");
  const commits = commitData.slice(0, 100).map((item: { sha?: string; author?: { login?: string }; commit?: { message?: string; author?: { date?: string } } }) => ({
    sha: String(item.sha || ""),
    message: String(item.commit?.message || "").split("\n")[0].slice(0, 300),
    date: String(item.commit?.author?.date || ""),
    author: typeof item.author?.login === "string" ? item.author.login.slice(0, 80) : null,
  })).filter((item) => /^[a-f\d]{40}$/i.test(item.sha) && !Number.isNaN(Date.parse(item.date)));
  const languageEntries = Object.entries(languageData).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] >= 0);
  const totalLanguageBytes = languageEntries.reduce((sum, entry) => sum + entry[1], 0);
  const languages = languageEntries.sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, bytes]) => ({ name, bytes }));
  return { commits, languages, totalLanguageBytes, commitLimitReached: commitData.length >= 100, page };
}

export interface RepositoryPageOptions {
  page: number;
  visibility: "all" | "public" | "private";
  affiliation: "owner" | "collaborator" | "organization_member" | "all";
  sort: "updated" | "pushed" | "created" | "full_name";
  direction: "asc" | "desc";
}

export async function getAccountRepositories(token: string, options: RepositoryPageOptions = { page: 1, visibility: "all", affiliation: "owner", sort: "updated", direction: "desc" }): Promise<AccountRepository[]> {
  const url = new URL("https://api.github.com/user/repos");
  url.searchParams.set("affiliation", options.affiliation === "all" ? "owner,collaborator,organization_member" : options.affiliation);
  url.searchParams.set("visibility", options.visibility);
  url.searchParams.set("sort", options.sort);
  url.searchParams.set("direction", options.direction);
  url.searchParams.set("per_page", "100");
  url.searchParams.set("page", String(options.page));
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Repora-App",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(response.status === 401 ? "expired" : response.status === 403 ? "forbidden" : "upstream");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("upstream");
  return data.slice(0, 100).map((repo: AccountRepository) => ({
    id: repo.id,
    full_name: repo.full_name,
    name: repo.name,
    description: repo.description,
    private: repo.private,
    html_url: repo.html_url,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    open_issues_count: repo.open_issues_count,
    updated_at: repo.updated_at,
    archived: repo.archived,
    fork: repo.fork,
    default_branch: repo.default_branch,
  }));
}

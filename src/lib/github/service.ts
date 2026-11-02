export interface PublicProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface PublicRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  fork: boolean;
}

export interface PublicEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
}

export interface GithubAnalysis {
  profile: PublicProfile;
  repositories: PublicRepository[];
  events: PublicEvent[];
  languages: { name: string; repositories: number; percent: number }[];
  stats: { repositories: number; stars: number; forks: number };
  repositoryCoverage: { fetched: number; total: number; limited: boolean };
}

export type GithubErrorCode =
  | "invalid"
  | "not_found"
  | "rate_limit"
  | "forbidden"
  | "timeout"
  | "network"
  | "upstream";

export class GithubError extends Error {
  constructor(
    public code: GithubErrorCode,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GithubError";
  }
}

export type GithubFetch = typeof fetch;

const USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const API_ORIGIN = "https://api.github.com";
const TIMEOUT_MS = 8_000;
const REPOSITORY_LIMIT = 100;
const EVENT_LIMIT = 20;

function isTimeout(error: unknown): boolean {
  return error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError");
}

async function github<T>(
  path: string,
  fetcher: GithubFetch,
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
  let response: Response;

  try {
    response = await fetcher(`${API_ORIGIN}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Repora-Analytics",
      },
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate: 120 },
    });
  } catch (error) {
    if (isTimeout(error)) {
      throw new GithubError("timeout", "GitHub request timed out", 504);
    }
    throw new GithubError("network", "GitHub network error", 503);
  }

  if (response.status === 404) {
    throw new GithubError("not_found", "GitHub resource not found", 404);
  }

  if (response.status === 403) {
    const body = await response.clone().text().catch(() => "");
    const isRateLimit =
      response.headers.get("x-ratelimit-remaining") === "0" ||
      response.headers.has("retry-after") ||
      /rate limit|secondary rate/i.test(body);
    if (isRateLimit) {
      throw new GithubError("rate_limit", "GitHub rate limit reached", 429);
    }
    throw new GithubError("forbidden", "GitHub denied this request", 403);
  }

  if (response.status === 429) {
    throw new GithubError("rate_limit", "GitHub rate limit reached", 429);
  }

  if (response.status >= 500) {
    throw new GithubError("upstream", `GitHub API returned ${response.status}`, response.status);
  }

  if (!response.ok) {
    throw new GithubError("upstream", `GitHub API returned ${response.status}`, 502);
  }

  return response.json() as Promise<T>;
}

export async function analyzePublicUser(
  input: string,
  fetcher: GithubFetch = fetch,
  timeoutMs = TIMEOUT_MS,
): Promise<GithubAnalysis> {
  const username = input.trim();
  if (!USERNAME.test(username)) {
    throw new GithubError("invalid", "Invalid GitHub username", 400);
  }

  const rawProfile = await github<PublicProfile>(
    `/users/${encodeURIComponent(username)}`,
    fetcher,
    timeoutMs,
  );
  const profile: PublicProfile = {
    login: rawProfile.login,
    name: rawProfile.name,
    avatar_url: rawProfile.avatar_url,
    html_url: rawProfile.html_url,
    bio: rawProfile.bio,
    public_repos: rawProfile.public_repos,
    followers: rawProfile.followers,
    following: rawProfile.following,
    created_at: rawProfile.created_at,
  };

  const [rawRepositories, rawEvents] = await Promise.all([
    github<PublicRepository[]>(
      `/users/${encodeURIComponent(profile.login)}/repos?type=owner&sort=updated&per_page=${REPOSITORY_LIMIT}`,
      fetcher,
      timeoutMs,
    ),
    github<PublicEvent[]>(
      `/users/${encodeURIComponent(profile.login)}/events/public?per_page=${EVENT_LIMIT}`,
      fetcher,
      timeoutMs,
    ).catch(() => [] as PublicEvent[]),
  ]);

  const repositories = rawRepositories.slice(0, REPOSITORY_LIMIT).map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    language: repo.language,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    archived: repo.archived,
    fork: repo.fork,
  }));
  const events = rawEvents.slice(0, EVENT_LIMIT).map((event) => ({
    id: event.id,
    type: event.type,
    created_at: event.created_at,
    repo: { name: event.repo.name },
  }));

  const languageCounts = new Map<string, number>();
  for (const repository of repositories) {
    if (repository.language) {
      languageCounts.set(
        repository.language,
        (languageCounts.get(repository.language) ?? 0) + 1,
      );
    }
  }
  const languageTotal = [...languageCounts.values()].reduce((sum, n) => sum + n, 0);
  const languages = [...languageCounts]
    .map(([name, count]) => ({
      name,
      repositories: count,
      percent: languageTotal ? Math.round((count / languageTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.repositories - a.repositories);

  return {
    profile,
    repositories: repositories.sort((a, b) => b.stargazers_count - a.stargazers_count),
    events,
    languages,
    stats: {
      repositories: profile.public_repos,
      stars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      forks: repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
    },
    repositoryCoverage: {
      fetched: repositories.length,
      total: profile.public_repos,
      limited: profile.public_repos > repositories.length,
    },
  };
}

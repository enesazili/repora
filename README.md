# Repora

Repora is a GitHub analytics application built with Next.js App Router, TypeScript, Tailwind CSS v4 and Lucide. It uses six token-driven palettes with light/dark modes, independent glass surfaces, Turkish/English localization, GitHub OAuth, authenticated repository analytics and public report URLs.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. For a production check use `npm run build` and `npm run start`.

## Use

- The workspace requires a real GitHub session. Sign in with GitHub to load accessible repositories, commit samples, pull request/issue analytics, languages, insights, favorites and comparisons.
- Settings controls six palettes, light/dark mode, glass, reduced motion, language and persistent dashboard layout. Preferences are stored locally and synced to the account when authenticated.
- Repository analysis is capped at 100 owned public repositories per lookup. When the API result is incomplete, the interface reports the shown/total coverage; stars, forks and language counts cover fetched repositories. GitHub's unauthenticated rate limits apply.
- GitHub service tests use mocked `fetch` responses (no live API requests): `npm test`.
- Full account-wide contribution history remains unavailable; repository activity views show bounded GitHub API samples. OAuth requires a configured GitHub OAuth App and a newly rotated Client Secret.

For GitHub sign-in, configure `GITHUB_CLIENT_ID`, a newly rotated `GITHUB_CLIENT_SECRET`, and `REPORA_TOKEN_ENCRYPTION_KEY` (64 hex characters) in ignored `.env.local`. Start with `npm run dev` at `http://localhost:3000`; configure the GitHub OAuth callback as `http://localhost:3000/api/auth/callback/github`. The current `repo read:user` OAuth scopes support private repository access and profile data. The workspace requires a real GitHub session; public report URLs remain accessible without login. Restart the development server after changing `.env.local`. SQLite session storage needs a persistent writable disk and a single server instance.

For a connected account, select a repository to load default-branch commits across 30 or 90 days (up to 1,000 in pages of 100), a daily heatmap, and GitHub language byte shares. Favorite repositories persist to the account and can be filtered. These commit samples do not represent full contribution history.

The repository explorer loads 100 repositories per page and can request up to 20 pages per filter set. Relationship, visibility and GitHub list order are applied on the server; search, language, archive, stars, forks and favorites filters cover loaded pages. Repository details also sample up to 100 recently updated pull requests and issues. The connected account overview uses its first 100 owned repositories, so its totals may be partial.
The explorer can export loaded, filtered rows locally as CSV or JSON. Private repository data is never published as a shareable report.
The explorer also supports an authenticated 2–4 repository sample comparison and server-side search across repositories owned by the connected account. Public repositories have shareable `/reports?owner=...&repo=...` snapshot pages; these are fetched independently without account tokens and can be printed. Private comparison data is never shared through report URLs.
Authenticated search also supports private repositories accessible through collaboration or organizations. Public 2–4 repository comparisons can be shared at `/reports/compare?repos=owner/repo,owner/repo`; each repository is independently checked through GitHub's public API. Public collaborator/organization repositories are searchable only among loaded explorer pages.
The connected dashboard can reorder or hide its summary, recent, language, favorite and activity sections; these choices persist to account preferences.

## Quality commands

```bash
npm run typecheck
npm run lint
npm run check:themes
npm test
npm run build
```

See [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md), [ROADMAP.md](./ROADMAP.md), and [AGENTS.md](./AGENTS.md) for architecture, project status, and contributor rules.

## Teknoloji / Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS 4 · Lucide React · SQLite. Public API requests run through a same-origin Route Handler and are cached briefly; authenticated requests are private and uncached.

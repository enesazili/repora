# Repora Project Context

## Current status

- **Phase 1 — Complete:** foundation, semantic theme system, responsive shell and clearly identified deterministic demo dashboard.
- **Phase 2 — Complete for the current MVP:** six palettes with light/dark modes, independently persisted glass preference, English/Turkish UI dictionary and preference, and localization of primary/secondary screens, empty/loading/error states and chart/heatmap labels. Theme contrast audit passes across all 228 checked pairs. Manual browser review covered both locales on the overview and 404, plus English settings/coming-soon at the available 800 CSS-pixel viewport; locale/theme/glass values survived reload and no horizontal overflow was observed. A dedicated 390px device-emulation/browser suite is not configured.
- **Phase 3 — Complete for public username-analysis MVP:** public GitHub data, bounded API access, error handling, cache directives, coverage/event scope notes and mocked service tests. Full contribution history is not available.
- **Phase 4 — In progress:** the app now requires a real GitHub session for workspace routes. The login page, OAuth state flow, server sessions, encrypted tokens, and logout are implemented. Live OAuth still needs a newly rotated Client Secret and has not been exercised against GitHub.

## Architecture

- Auth uses GitHub OAuth with a short-lived state cookie, SQLite-backed server sessions and encrypted GitHub access tokens (AES-256-GCM). Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and a 32-byte hex `REPORA_TOKEN_ENCRYPTION_KEY` in `.env.local`. Configure the OAuth callback as `/api/auth/callback/github` on the same origin. The `repo` scope is required for private repositories. SQLite data lives under ignored `data/`; this local disk architecture requires persistent writable storage and is not suitable for stateless multi-instance deployment.
- `/api/user/repositories` pages through authenticated GitHub repositories (100/page, at most 20 pages), with server-validated visibility, relationship and GitHub sort. The explorer filters and sorts loaded pages locally and labels that scope. Responses are private and no-store. The demo login endpoint is removed and legacy demo sessions are rejected. Mutation routes require same-origin requests.
- `/api/user/repository-activity` fetches default-branch commits for a selected 30/90-day period in pages of 100, capped at 10 pages. Language bytes are fetched only on page one. Requests use the authenticated token, a fixed GitHub API origin, path validation, 8-second timeouts, and private no-store responses. The repository screen shows a daily heatmap from loaded commits, language shares, and persisted favorites filtering. Pagination can shift if new commits arrive during browsing; this is not a complete contribution history.
- `/api/user/repository-workflow` samples up to 100 recently updated pull requests and 100 issues for one selected repository. PRs are removed from the issues sample. The detail panel shows sample state counts, median merge duration, recent items and issue labels. The authenticated overview now uses owned repository data instead of demo metrics and labels partial coverage.
- The authenticated explorer exports loaded, filtered repository rows to local CSV or JSON files. CSV cells are escaped for spreadsheet formula injection. Private rows are never published as shareable reports.
- Authenticated explorer comparison lets users select 2–4 loaded repositories and fetches 30-day commit and recent PR/issue samples only on request. It shows relative stars, forks, languages and sample counts; private comparison data stays behind the session.
- `/api/user/repository-search` uses GitHub Search API with bounded input and 30 results/page (up to the 1,000-result search ceiling). Owned search injects `user:<login>`; accessible-private search injects `is:private` and discards non-private results. Both are authenticated, private and no-store. Search has a separate rate limit. Public collaborator/organization repositories remain searchable only in loaded explorer pages because GitHub Search has no account-access qualifier for that set without enumerating owners.
- `/api/report` and `/api/report/comparison` independently fetch 1 or 2–4 public repositories without access tokens and reject non-public responses. `/reports` and `/reports/compare` are shareable and print-friendly; comparison reports support local CSV/JSON export. Neither path consumes authenticated repository responses.
- Authenticated overview stores recent/language/favorite/activity section visibility and ordering plus the selected favorite repository in the existing `widget_config` account preference. The activity widget reuses authenticated commit and workflow views. Users can reset the layout; the preferences route bounds the JSON payload. Favorite names come from the account's saved favorites, including repositories beyond the first overview page.
- Repository details now group the loaded commit sample by day, week or month, show linked GitHub author participation within that sample, and show 30/90-day weekly PR creation/merge and issue creation/closure trends from the existing recently updated sample. A bounded, best-effort release request shows up to 30 recent published releases. These are explicitly samples, not complete historical totals.
- Contributions now lets the account choose an accessible repository and inspect its real default-branch commit and workflow samples; it does not claim account-wide contribution completeness. Languages shows primary-language counts from explicitly loaded accessible repository pages and byte shares for a selected repository. Dashboard layout controls now live in Settings. New local preferences default glass to on while preserving an explicit off choice.
- Activity reuses the real selected-repository workflow view; Insights aggregates loaded accessible repository metadata, including stars/forks and a ranked list. All four destinations show bounded samples rather than synthetic account totals. The 6-palette/12-mode redesign is implemented; full settings and visual audit remain incomplete.
- `.env.example` documents the active encryption key and SQLite requirements. Live production security and deployment validation still require a configured OAuth app and persistent storage.
- Repository cleanup removed the unreferenced deterministic demo dashboard component graph and fixtures. `.codebase-memory/` is ignored and its three generated index files were removed from Git tracking while retained locally for tooling. No credentials, databases, build output or local environment files are tracked.

- Next.js 16.4 App Router, React 19, TypeScript, Tailwind CSS v4 and Lucide React; `cacheComponents` and partial prefetching are enabled.
- `src/app/(app)` contains the workspace; reusable UI/layout/dashboard/settings code lives in `src/components`.
- Locale dictionary/provider: `src/i18n/index.tsx`. Supports `en` and `tr`, persists `repora.locale` in localStorage and formats dates/numbers with `Intl`. Locale is client-side; server fallback is English. User-entered and GitHub-provided text is not translated.
- GitHub Route Handler: `src/app/api/github/[username]/route.ts`; the service and result types are in `src/lib/github/service.ts`. The service contacts only `https://api.github.com`, validates usernames, uses an 8-second timeout and sets 120-second Next fetch revalidation. The Route Handler marks successful responses for shared caching and errors `no-store`.
- Per lookup: one profile request, one owned-repositories request capped at 100 and one best-effort public-events request capped at 20. Events are not full activity/contribution history. Languages count repository primary-language values, not bytes.
- Theme metadata lives in `src/config/themes.ts`; semantic tokens live in `src/styles/themes.css`. The early head script and provider persist theme/glass independently. `npm run check:themes` audits contrast pairs.
- Demo fixtures live in `src/data/demo`. Deterministic trend, activity and contribution fixtures are shown only when no live analysis is active; they are hidden while live GitHub results are displayed.

## Themes

GitHub Light/Dark, Solarized Light/Dark, Dracula, Monokai, Nord, Gruvbox Light/Dark, One Dark, Catppuccin Latte/Frappé/Macchiato/Mocha, Tokyo Night, Rosé Pine/Moon, Ayu Dark, Everforest Dark, Kanagawa, Night Owl and Material Palenight (22 total).

All use semantic background/foreground/surface/sidebar/border/muted/accent/status/chart tokens. Glass affects panel/chrome surfaces, uses capped blur and respects reduced-motion preferences.

## Known limitations

- Live OAuth callback, private repository permissions, and session persistence after a production deployment remain unverified without a GitHub OAuth app. The explorer can load up to 2,000 repositories per filter set; local filters and aggregate counts cover loaded pages only. GitHub permission scope can limit organization results.
- Per-repository commit history covers up to 1,000 loaded commits on the default branch within 30/90 days. The heatmap can undercount until all pages are loaded and if the 10-page cap is hit; merge commits and other authors can appear. Language percentages use GitHub's repository byte totals.
- Windows Computer Use stopped because it could not determine the browser URL confidently. The requested 390px and full theme/glass visual review remains incomplete.

- Public unauthenticated API availability and rate limits are controlled by GitHub. Error mapping includes validation, 403 forbidden/rate-limit, 404, 429, timeout, network and upstream failures. Automated service tests use mocked fetch responses; they do not load-test GitHub or prove Next's deployed cache behavior.
- Stars/forks/language totals cover fetched repositories (up to the first 100); the profile repository count is GitHub's reported count. No additional repository pages are fetched.
- The public Events endpoint is best-effort and only returns a limited recent public feed. Full contribution history and organization membership remain unavailable; private repositories require an authenticated account. Do not synthesize live values.
- Browser review included English/Turkish overview and 404, English settings/coming-soon and preference persistence at the available 800 CSS-pixel viewport. No horizontal overflow was observed on the settings view. A 390px device emulation, exhaustive theme × glass visual matrix and automated browser suite were not available/run.

## Run and validate

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run check:themes
npm test
npm run build
```

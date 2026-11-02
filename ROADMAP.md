# Repora Roadmap

## Phase 1 — Foundation & Design Prototype — Complete

- Next.js App Router/TypeScript/Tailwind base, responsive application shell, accessible navigation/panels, semantic design tokens and deterministic demo data.
- Demo metrics and contribution/activity fixtures are explicitly separate from live GitHub analysis.

## Phase 2 — Design Approval & Refinement — Implementation complete; visual QA partial

- Responsive dashboard/settings, six palettes with light/dark modes, independent persisted glass preference, keyboard/focus support and 228-pair contrast audit.
- Central English/Turkish dictionary and persisted locale cover the overview, settings, placeholders, 404/loading states, notifications, chart/heatmap labels and GitHub errors. User/GitHub supplied content remains unchanged.
- Browser spot-checks covered English/Turkish overview and 404, English settings/coming-soon and preference persistence at the available 800 CSS-pixel viewport. No dedicated 390px device emulation, browser automation or exhaustive theme/glass visual matrix was run; see `PROJECT_CONTEXT.md`.

## Phase 3 — GitHub Public API Integration — Complete (public username-analysis MVP)

- Same-origin Route Handler; validated username; fixed `api.github.com` origin; 8-second request timeout; 120-second fetch revalidation and shared success-cache/error no-store headers.
- Controlled invalid, not-found, rate-limit (403/429), forbidden, timeout, network and upstream API failures, with bilingual user messages.
- Fetches public profile, up to 100 owned public repositories and up to 20 recent public events. Reports partial repository coverage and limits calculated totals/language breakdown to fetched repositories.
- Live analysis hides demo metric/activity/contribution panels. Public Events are clearly described as a limited recent feed, not a complete contribution history; no live contribution values are fabricated.
- Mocked Node tests cover username validation, fixed host/request limits/cache revalidation options, repository cap, status mapping, timeout/network behavior and best-effort event failures. These do not exercise a deployed Next cache or live GitHub behavior.

## Phase 4 — GitHub OAuth & Authentication — In progress

OAuth callback/state flow, server sessions, encrypted access tokens, login-first routing, logout, and a private repository workspace are implemented. Demo authentication and sample-only analytics pages have been removed from the live workspace. A replacement GitHub Client Secret, live OAuth, 390px visual QA, deployment-ready session storage, and production security review remain.

Authenticated repository detail includes paginated 30/90-day commit samples, a daily heatmap, language byte shares, and persisted favorites filtering. Complete historical coverage remains.

Repository explorer pagination, visibility/relationship filters, loaded-result search/sorting, sampled PR/issue analytics, a real authenticated overview, and local CSV/JSON export are implemented.
Authenticated 2–4 repository comparison, server-side owned and accessible-private search, independently verified public single-repository and comparison reports, and persisted overview section visibility/order with a favorite repository activity widget are implemented. Commit day/week/month grouping, sampled contributor and weekly PR/issue trends, and bounded recent release history are implemented. Remaining: public collaborator/organization repository discovery beyond loaded pages, deeper contributor/release history, live OAuth and mobile visual QA.

Contributions, Activity, Languages and Insights now use authenticated GitHub repository data with explicit coverage labels. Dashboard layout editing moved to Settings; typography, branding, profile navigation, search chrome and the 6-palette theme migration are implemented. Full visual QA and the remaining settings polish are still pending.

Repository cleanup is complete for the current source tree: unreferenced demo dashboard components/fixtures were removed, generated Codebase Memory files were untracked and ignored, and README/security ignore documentation was refreshed.

## Later phases — Not started

Contributor/release analytics and release/deployment work remain future scope. Coming-soon routes are placeholders, not implemented features.

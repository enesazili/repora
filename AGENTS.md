<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repora project rules

- Continue the existing app; do not scaffold over or discard user changes. Check `git status` before edits. In this workspace the unrelated `portfolio-site/` deletions and untracked `repora/` project may be user work: never restore/reset them.
- Read `PROJECT_CONTEXT.md` and `ROADMAP.md` before broad changes. Keep changes within the active requested phase; OAuth/authentication is Phase 4 and is out of Phase 3 scope.
- Keep the existing Next.js App Router, TypeScript, Tailwind semantic-token, theme-provider and local demo-data architecture. Avoid new dependencies unless necessary.
- UI colors must use semantic theme tokens; update every theme token block and `npm run check:themes` if changing the token contract. Don't use mock values as live GitHub results.
- Public GitHub requests must go only through `src/lib/github/service.ts` and its Route Handler. Keep the origin fixed to `api.github.com`, validate username input, bound result/page sizes, cache responsibly, and don't expose credentials.
- User-visible strings belong in the central `src/i18n/index.tsx` dictionary for both English and Turkish. Update both locales and use `Intl` for formatted dates/numbers. Keep user-provided/profile/repository text untouched.
- Maintain accessible labels, focus states, keyboard interaction, responsive layouts and reduced-motion behavior. Check touched screens on mobile widths.
- Update README, PROJECT_CONTEXT and ROADMAP when scope, architecture, known limitations, commands, or completion state changes. Never claim an untested check passed.
- Before completion run `npm run typecheck`, `npm run lint`, `npm run check:themes`, `npm test`, and `npm run build`; test API/UI behavior that changed and report untested failure modes honestly. GitHub service tests must use mocked `fetch`, not unnecessary live API calls.

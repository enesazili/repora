import test from "node:test";
import assert from "node:assert/strict";
import { searchOwnedRepositories } from "./search.ts";
import { getPublicRepositoryReport, getPublicComparisonReports } from "./public-report.ts";

test("owned search fixes owner qualifier and bounds returned data", async () => {
  const original = globalThis.fetch;
  let requested;
  globalThis.fetch = async (url) => { requested = new URL(url); return Response.json({ total_count: 2, incomplete_results: false, items: [{ id: 1, full_name: "alice/one", private: true }, { id: 2, full_name: "other/two", private: false }] }); };
  try {
    const result = await searchOwnedRepositories("token", "alice", "design", 1, "best-match");
    assert.equal(requested.origin, "https://api.github.com");
    assert.match(requested.searchParams.get("q"), /user:alice/);
    assert.equal(requested.searchParams.get("per_page"), "30");
    assert.deepEqual(result.repositories.map((repo) => repo.full_name), ["alice/one"]);
  } finally { globalThis.fetch = original; }
});

test("private search uses GitHub visibility qualifier and rejects public results", async () => {
  const original = globalThis.fetch;
  let requested;
  globalThis.fetch = async (url) => { requested = new URL(url); return Response.json({ total_count: 2, items: [{ id: 1, full_name: "org/secret", private: true }, { id: 2, full_name: "org/public", private: false }] }); };
  try {
    const result = await searchOwnedRepositories("token", "alice", "design", 1, "best-match", "accessible-private");
    assert.match(requested.searchParams.get("q"), /is:private/);
    assert.deepEqual(result.repositories.map((repo) => repo.full_name), ["org/secret"]);
  } finally { globalThis.fetch = original; }
});

test("public report rejects private data and never sends credentials", async () => {
  const original = globalThis.fetch;
  let options;
  globalThis.fetch = async (_url, init) => { options = init; return Response.json({ private: true, full_name: "alice/private" }); };
  try {
    await assert.rejects(getPublicRepositoryReport("alice", "private"), /not_found/);
    assert.equal(options.headers.Authorization, undefined);
  } finally { globalThis.fetch = original; }
});

test("public comparison rejects a private member and duplicate repositories", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => { calls++; assert.equal(options.headers.Authorization, undefined); return Response.json({ private: String(url).includes("secret"), full_name: "owner/repo", stargazers_count: 1 }); };
  try {
    await assert.rejects(getPublicComparisonReports("owner/public,owner/secret"), /not_found/);
    assert.equal(calls, 2);
    await assert.rejects(getPublicComparisonReports("owner/public,OWNER/PUBLIC"), /invalid/);
  } finally { globalThis.fetch = original; }
});

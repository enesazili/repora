import test from "node:test";
import assert from "node:assert/strict";
import { getAccountRepositories, getRepositoryActivity, getRepositoryWorkflow } from "./authenticated.ts";

test("authenticated repositories use fixed GitHub endpoint, bound output and no-store", async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return new Response(JSON.stringify(Array.from({ length: 101 }, (_, id) => ({ id, name: `r${id}`, full_name: `owner/r${id}`, private: true, html_url: `https://github.com/owner/r${id}` }))), { status: 200 });
  };
  try {
    const repos = await getAccountRepositories("test-token");
    assert.equal(repos.length, 100);
    assert.equal(new URL(captured.url).origin, "https://api.github.com");
    assert.equal(new URL(captured.url).searchParams.get("per_page"), "100");
    assert.equal(captured.options.cache, "no-store");
    assert.equal(captured.options.headers.Authorization, "Bearer test-token");
    assert.equal(JSON.stringify(repos).includes("test-token"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("expired GitHub authorization is reported", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 401 });
  try {
    await assert.rejects(getAccountRepositories("expired"), /expired/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("repository pages send bounded filters to GitHub", async () => {
  const originalFetch = globalThis.fetch;
  let requested;
  globalThis.fetch = async (url) => { requested = new URL(url); return Response.json([]); };
  try {
    await getAccountRepositories("token", { page: 2, visibility: "private", affiliation: "all", sort: "pushed", direction: "desc" });
    assert.equal(requested.origin, "https://api.github.com");
    assert.equal(requested.searchParams.get("page"), "2");
    assert.equal(requested.searchParams.get("per_page"), "100");
    assert.equal(requested.searchParams.get("visibility"), "private");
    assert.equal(requested.searchParams.get("affiliation"), "owner,collaborator,organization_member");
    assert.equal(requested.searchParams.get("sort"), "pushed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("repository activity validates path and bounds commit/language output", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith("/languages")) return Response.json({ TypeScript: 800, CSS: 200 });
    return Response.json(Array.from({ length: 105 }, (_, index) => ({ sha: index.toString(16).padStart(40, "0"), author: { login: "alice" }, commit: { message: `Commit ${index}\nDetail`, author: { date: "2026-10-31T12:00:00Z" } } })));
  };
  try {
    await assert.rejects(getRepositoryActivity("token", "bad/owner", "repo"), /invalid/);
    await assert.rejects(getRepositoryActivity("token", "owner", ".."), /invalid/);
    assert.equal(calls.length, 0);
    const activity = await getRepositoryActivity("token", "owner", "repo");
    assert.equal(calls.length, 2);
    assert.ok(calls.every((call) => call.url.startsWith("https://api.github.com/repos/owner/repo/")));
    assert.ok(calls.every((call) => call.options.cache === "no-store"));
    assert.equal(activity.commits.length, 100);
    assert.equal(activity.commits[0].message, "Commit 0");
    assert.equal(activity.commits[0].author, "alice");
    assert.equal(activity.totalLanguageBytes, 1000);
    assert.equal(activity.commitLimitReached, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("release fetch failure keeps PR and issue analytics available", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/releases?")) throw new Error("network");
    return Response.json([]);
  };
  try {
    const workflow = await getRepositoryWorkflow("token", "owner", "repo");
    assert.deepEqual(workflow.pullRequests, []);
    assert.equal(workflow.releasesUnavailable, true);
  } finally { globalThis.fetch = originalFetch; }
});

test("empty repositories have no commits", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => String(url).includes("/commits?") ? new Response(null, { status: 409 }) : Response.json({});
  try {
    const activity = await getRepositoryActivity("token", "owner", "empty");
    assert.deepEqual(activity.commits, []);
    assert.deepEqual(activity.languages, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("older commit pages use a bounded date range without repeating language requests", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => { urls.push(new URL(url)); return Response.json([]); };
  try {
    const activity = await getRepositoryActivity("token", "owner", "repo", 90, 2);
    assert.equal(urls.length, 1);
    assert.equal(urls[0].searchParams.get("page"), "2");
    assert.ok(urls[0].searchParams.get("since"));
    assert.deepEqual(activity.languages, []);
    await assert.rejects(getRepositoryActivity("token", "owner", "repo", 90, 11), /invalid/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("workflow excludes pull requests from issues and bounds samples", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/pulls?")) return Response.json([{ number: 1, title: "Fix", state: "closed", created_at: "2026-10-01", merged_at: "2026-10-02", closed_at: "2026-10-02" }]);
    if (String(url).includes("/releases?")) return Response.json([{ id: 7, name: "v1", published_at: "2026-10-03T00:00:00Z" }]);
    return Response.json([{ number: 1, pull_request: {}, title: "PR", state: "closed" }, { number: 2, title: "Issue", state: "open", created_at: "2026-10-01", closed_at: null, labels: [{ name: "bug" }] }]);
  };
  try {
    const workflow = await getRepositoryWorkflow("token", "owner", "repo");
    assert.equal(calls.length, 3);
    assert.ok(calls.every((call) => call.url.startsWith("https://api.github.com/repos/owner/repo/") && call.options.cache === "no-store"));
    assert.equal(workflow.pullRequests.length, 1);
    assert.equal(workflow.issues.length, 1);
    assert.deepEqual(workflow.issues[0].labels, ["bug"]);
    assert.deepEqual(workflow.releases.map((release) => release.name), ["v1"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

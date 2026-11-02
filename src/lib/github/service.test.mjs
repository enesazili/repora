import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("./service.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { analyzePublicUser, GithubError } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

const profile = {
  login: "octocat", name: "Octocat", avatar_url: "https://example.test/avatar.png",
  html_url: "https://github.com/octocat", bio: null, public_repos: 1,
  followers: 2, following: 3, created_at: "2011-01-25T18:44:36Z",
};
const repo = {
  id: 1, name: "hello-world", full_name: "octocat/hello-world", description: null,
  html_url: "https://github.com/octocat/hello-world", stargazers_count: 4,
  forks_count: 1, language: "JavaScript", created_at: "2011-01-26T19:01:12Z",
  updated_at: "2025-01-01T00:00:00Z", archived: false, fork: false,
};
function response(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), { status, headers });
}
function fixtureFetch({ profileResponse = response(profile), repoResponse = response([repo]), eventResponse = response([]) } = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("/users/octocat/repos?")) return repoResponse;
    if (String(url).includes("/events/public?")) return eventResponse;
    return profileResponse;
  };
  return { calls, fetcher };
}

test("validates username before making any request", async () => {
  const { calls, fetcher } = fixtureFetch();
  await assert.rejects(analyzePublicUser("bad/name", fetcher), (error) => error instanceof GithubError && error.code === "invalid" && error.status === 400);
  assert.equal(calls.length, 0);
});

test("uses only the fixed API origin, three bounded requests, and Next revalidation", async () => {
  const { calls, fetcher } = fixtureFetch();
  const result = await analyzePublicUser("octocat", fetcher);
  assert.equal(result.stats.stars, 4);
  assert.equal(result.repositoryCoverage.limited, false);
  assert.equal(calls.length, 3);
  assert.ok(calls.every(({ url }) => url.startsWith("https://api.github.com/")));
  assert.ok(calls.every(({ options }) => options.next.revalidate === 120));
  assert.ok(calls.some(({ url }) => url.includes("per_page=100")));
  assert.ok(calls.some(({ url }) => url.includes("per_page=20")));
});

test("reports repository coverage beyond the first 100 without extra pages", async () => {
  const largeProfile = response({ ...profile, public_repos: 135 });
  const repositories = Array.from({ length: 100 }, (_, index) => ({ ...repo, id: index + 1 }));
  const { calls, fetcher } = fixtureFetch({ profileResponse: largeProfile, repoResponse: response(repositories) });
  const result = await analyzePublicUser("octocat", fetcher);
  assert.deepEqual(result.repositoryCoverage, { fetched: 100, total: 135, limited: true });
  assert.equal(calls.length, 3);
});

test("maps 404, rate-limit 403, ordinary 403, 429, and upstream 500", async (t) => {
  const cases = [
    ["404", response({}, 404), "not_found", 404],
    ["403 rate limit", response({ message: "limit" }, 403, { "x-ratelimit-remaining": "0" }), "rate_limit", 429],
    ["403 forbidden", response({ message: "blocked" }, 403), "forbidden", 403],
    ["429", response({}, 429), "rate_limit", 429],
    ["500", response({}, 500), "upstream", 500],
  ];
  for (const [name, result, code, status] of cases) {
    await t.test(name, async () => {
      const { fetcher } = fixtureFetch({ profileResponse: result });
      await assert.rejects(analyzePublicUser("octocat", fetcher), (error) => error.code === code && error.status === status);
    });
  }
});

test("distinguishes timeout from network failures", async (t) => {
  await t.test("timeout", async () => {
    let observedSignal;
    const fetcher = async (_url, options) => {
      observedSignal = options.signal;
      return new Promise((_, reject) => options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true }));
    };
    await assert.rejects(analyzePublicUser("octocat", fetcher, 10), (error) => error.code === "timeout" && error.status === 504);
    assert.ok(observedSignal instanceof AbortSignal);
  });
  await t.test("network", async () => {
    const fetcher = async () => { throw new TypeError("offline"); };
    await assert.rejects(analyzePublicUser("octocat", fetcher), (error) => error.code === "network" && error.status === 503);
  });
});

test("treats recent public events as best-effort while profile and repositories remain available", async () => {
  const { fetcher } = fixtureFetch({ eventResponse: response({}, 500) });
  const result = await analyzePublicUser("octocat", fetcher);
  assert.deepEqual(result.events, []);
});

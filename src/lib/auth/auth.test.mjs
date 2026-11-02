import test from "node:test";
import assert from "node:assert/strict";

process.env.REPORA_TEST_DB = "1";
process.env.REPORA_TOKEN_ENCRYPTION_KEY = "a".repeat(64);

test("tokens are encrypted at rest and tampering is rejected", async () => {
  const { dbRepository, getDb } = await import("../db/client.ts");
  const user = dbRepository.upsertUser({ github_id: 777124, login: "token_tester" });
  dbRepository.upsertAccount({ user_id: user.id, provider: "github", provider_account_id: "777124", access_token: "secret-test-token", scope: "repo" });
  const stored = getDb().prepare("SELECT access_token FROM accounts WHERE user_id = ?").get(user.id).access_token;
  assert.ok(!stored.includes("secret-test-token"));
  assert.equal(dbRepository.getGithubAccessToken(user.id), "secret-test-token");
  const parts = stored.split(":");
  parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  getDb().prepare("UPDATE accounts SET access_token = ? WHERE user_id = ?").run(parts.join(":"), user.id);
  assert.throws(() => dbRepository.getGithubAccessToken(user.id));
});

test("mutations require same origin", async () => {
  const { isSameOrigin } = await import("./origin.ts");
  assert.equal(isSameOrigin(new Request("http://localhost:3000/api/user/favorites", { headers: { origin: "http://localhost:3000" } })), true);
  assert.equal(isSameOrigin(new Request("http://localhost:3000/api/user/favorites", { headers: { origin: "https://evil.example" } })), false);
  assert.equal(isSameOrigin(new Request("http://localhost:3000/api/user/favorites")), false);
});

test("Auth & Session Management", async (t) => {
  const { dbRepository } = await import("../db/client.ts");

  await t.test("creates authenticated user and valid session", () => {
    const user = dbRepository.upsertUser({
      github_id: 777123,
      login: "auth_tester",
      name: "Auth Tester",
      email: "tester@repora.local",
    });

    const session = dbRepository.createSession(user.id);
    assert.ok(session.session_token);

    const lookup = dbRepository.findSession(session.session_token);
    assert.ok(lookup);
    assert.equal(lookup.user.login, "auth_tester");
    assert.equal(lookup.user.id, user.id);
  });

  await t.test("deleting session prevents further authentication", () => {
    const user = dbRepository.findUserByGithubId(777123);
    assert.ok(user);

    const session = dbRepository.createSession(user.id);
    dbRepository.deleteSession(session.session_token);

    const lookup = dbRepository.findSession(session.session_token);
    assert.equal(lookup, null);
  });
});

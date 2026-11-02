import test from "node:test";
import assert from "node:assert/strict";

process.env.REPORA_TEST_DB = "1";

test("Database Client", async (t) => {
  const { dbRepository, getDb } = await import("./client.ts");

  await t.test("initializes schema in memory", () => {
    const db = getDb();
    assert.ok(db, "Database should be initialized");
  });

  await t.test("creates, finds, and updates users", () => {
    const user = dbRepository.upsertUser({
      github_id: 12345,
      login: "testdev",
      name: "Test Developer",
      email: "test@example.com",
      avatar_url: "https://example.com/avatar.png",
      bio: "Code lover",
    });

    assert.ok(user.id);
    assert.equal(user.login, "testdev");
    assert.equal(user.github_id, 12345);

    const found = dbRepository.findUserById(user.id);
    assert.equal(found?.login, "testdev");

    const foundByGh = dbRepository.findUserByGithubId(12345);
    assert.equal(foundByGh?.id, user.id);

    // Update existing user
    const updated = dbRepository.upsertUser({
      github_id: 12345,
      login: "testdev-updated",
      name: "Updated Name",
    });
    assert.equal(updated.id, user.id);
    assert.equal(updated.login, "testdev-updated");
  });

  await t.test("handles sessions and expiry", () => {
    const user = dbRepository.findUserByGithubId(12345);
    assert.ok(user);

    const session = dbRepository.createSession(user.id, 1);
    assert.ok(session.session_token);

    const retrieved = dbRepository.findSession(session.session_token);
    assert.ok(retrieved);
    assert.equal(retrieved.user.id, user.id);
    assert.equal(retrieved.session.session_token, session.session_token);

    dbRepository.deleteSession(session.session_token);
    const afterDelete = dbRepository.findSession(session.session_token);
    assert.equal(afterDelete, null);
  });

  await t.test("manages user preferences and defaults", () => {
    const user = dbRepository.findUserByGithubId(12345);
    assert.ok(user);

    const prefs = dbRepository.getPreferences(user.id);
    assert.ok(prefs);
    assert.equal(prefs.theme, "github-dark");
    assert.equal(prefs.density, "comfortable");

    const updated = dbRepository.updatePreferences(user.id, {
      theme: "dracula",
      density: "compact",
      accent_color: "emerald",
      glass: 1,
    });

    assert.equal(updated.theme, "dracula");
    assert.equal(updated.density, "compact");
    assert.equal(updated.accent_color, "emerald");
    assert.equal(updated.glass, 1);
  });

  await t.test("manages favorite repositories and saved comparisons", () => {
    const user = dbRepository.findUserByGithubId(12345);
    assert.ok(user);

    dbRepository.addFavoriteRepository(user.id, 999, "testdev/repora");
    let favs = dbRepository.getFavoriteRepositories(user.id);
    assert.equal(favs.length, 1);
    assert.equal(favs[0].repo_full_name, "testdev/repora");

    // ignore duplicate
    dbRepository.addFavoriteRepository(user.id, 999, "testdev/repora");
    favs = dbRepository.getFavoriteRepositories(user.id);
    assert.equal(favs.length, 1);

    dbRepository.removeFavoriteRepository(user.id, 999);
    favs = dbRepository.getFavoriteRepositories(user.id);
    assert.equal(favs.length, 0);

    const compId = dbRepository.saveComparison(user.id, "Compare A vs B", ["org/repo-a", "org/repo-b"]);
    assert.ok(compId);
    const comps = dbRepository.getSavedComparisons(user.id);
    assert.equal(comps.length, 1);
    assert.equal(comps[0].title, "Compare A vs B");

    dbRepository.deleteComparison(user.id, compId);
    assert.equal(dbRepository.getSavedComparisons(user.id).length, 0);
  });
});

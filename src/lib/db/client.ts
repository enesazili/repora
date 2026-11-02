import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { decryptToken, encryptToken } from "../auth/token-crypto.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbInstance: DatabaseSync | null = null;

function getDbPath(): string {
  if (process.env.NODE_ENV === "test" || process.env.REPORA_TEST_DB === "1") {
    return ":memory:";
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "repora.db");
}

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDbPath();
  const db = new DatabaseSync(dbPath);
  
  // Enable foreign keys and WAL mode for better concurrency
  db.exec("PRAGMA foreign_keys = ON;");
  if (dbPath !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
  }

  // Run schema initialization
  initSchema(db);
  dbInstance = db;
  return db;
}

function initSchema(db: DatabaseSync) {
  const schemaPath = path.join(__dirname, "schema.sql");
  let schemaSql = "";
  if (fs.existsSync(schemaPath)) {
    schemaSql = fs.readFileSync(schemaPath, "utf-8");
  } else {
    // Fallback if bundled where __dirname differs
    schemaSql = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        github_id INTEGER UNIQUE,
        login TEXT NOT NULL,
        name TEXT,
        email TEXT,
        avatar_url TEXT,
        bio TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        access_token TEXT,
        scope TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        theme TEXT NOT NULL DEFAULT '',
        glass INTEGER NOT NULL DEFAULT 1,
        locale TEXT NOT NULL DEFAULT 'en',
        density TEXT NOT NULL DEFAULT 'comfortable',
        accent_color TEXT NOT NULL DEFAULT 'default',
        sidebar_collapsed INTEGER NOT NULL DEFAULT 0,
        widget_config TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS favorite_repositories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        repo_id INTEGER NOT NULL,
        repo_full_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, repo_id)
      );
      CREATE TABLE IF NOT EXISTS saved_comparisons (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        repo_names TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (session_token);
      CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts (user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorite_repositories (user_id);
    `;
  }
  db.exec(schemaSql);
}

export interface UserRecord {
  id: string;
  github_id: number | null;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesRecord {
  user_id: string;
  theme: string;
  glass: number;
  locale: string;
  density: string;
  accent_color: string;
  sidebar_collapsed: number;
  widget_config: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  session_token: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

interface SessionRow {
  s_id: string;
  session_token: string;
  user_id: string;
  expires_at: string;
  s_created_at: string;
  u_id: string;
  github_id: number | null;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  u_created_at: string;
  u_updated_at: string;
}

export const dbRepository = {
  findUserById(id: string): UserRecord | null {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const result = stmt.get(id);
    return (result as unknown as UserRecord) || null;
  },

  findUserByGithubId(githubId: number): UserRecord | null {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM users WHERE github_id = ?");
    const result = stmt.get(githubId);
    return (result as unknown as UserRecord) || null;
  },

  upsertUser(data: {
    github_id: number;
    login: string;
    name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  }): UserRecord {
    const db = getDb();
    const existing = this.findUserByGithubId(data.github_id);
    const now = new Date().toISOString();

    if (existing) {
      const stmt = db.prepare(`
        UPDATE users
        SET login = ?, name = ?, email = ?, avatar_url = ?, bio = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        data.login,
        data.name ?? null,
        data.email ?? null,
        data.avatar_url ?? null,
        data.bio ?? null,
        now,
        existing.id
      );
      return this.findUserById(existing.id)!;
    } else {
      const id = crypto.randomUUID();
      const stmt = db.prepare(`
        INSERT INTO users (id, github_id, login, name, email, avatar_url, bio, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        data.github_id,
        data.login,
        data.name ?? null,
        data.email ?? null,
        data.avatar_url ?? null,
        data.bio ?? null,
        now,
        now
      );

      // Create default preferences
      const prefStmt = db.prepare(`
        INSERT INTO user_preferences (user_id, theme, glass, locale, density, accent_color, sidebar_collapsed, updated_at)
        VALUES (?, 'github-dark', 1, 'en', 'comfortable', 'default', 0, ?)
      `);
      prefStmt.run(id, now);

      return this.findUserById(id)!;
    }
  },

  upsertAccount(data: {
    user_id: string;
    provider: string;
    provider_account_id: string;
    access_token?: string | null;
    scope?: string | null;
  }) {
    const db = getDb();
    const encryptedToken = data.access_token ? encryptToken(data.access_token) : null;
    const existing = db.prepare(
      "SELECT id FROM accounts WHERE provider = ? AND provider_account_id = ?"
    ).get(data.provider, data.provider_account_id) as { id: string } | undefined;

    if (existing) {
      const stmt = db.prepare(`
        UPDATE accounts
        SET access_token = ?, scope = ?
        WHERE id = ?
      `);
      stmt.run(encryptedToken, data.scope ?? null, existing.id);
    } else {
      const id = crypto.randomUUID();
      const stmt = db.prepare(`
        INSERT INTO accounts (id, user_id, provider, provider_account_id, access_token, scope)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        data.user_id,
        data.provider,
        data.provider_account_id,
        encryptedToken,
        data.scope ?? null
      );
    }
  },

  getGithubAccessToken(userId: string): string | null {
    const row = getDb().prepare(
      "SELECT access_token FROM accounts WHERE user_id = ? AND provider = 'github'"
    ).get(userId) as { access_token: string | null } | undefined;
    return row?.access_token ? decryptToken(row.access_token) : null;
  },

  hasDemoAccount(userId: string): boolean {
    return Boolean(getDb().prepare("SELECT 1 FROM accounts WHERE user_id = ? AND provider = 'demo'").get(userId));
  },

  createSession(userId: string, durationDays = 30): SessionRecord {
    const db = getDb();
    const id = crypto.randomUUID();
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO sessions (id, session_token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, sessionToken, userId, expiresAt, createdAt);

    return { id, session_token: sessionToken, user_id: userId, expires_at: expiresAt, created_at: createdAt };
  },

  findSession(token: string): { session: SessionRecord; user: UserRecord } | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT s.id as s_id, s.session_token, s.user_id, s.expires_at, s.created_at as s_created_at,
             u.id as u_id, u.github_id, u.login, u.name, u.email, u.avatar_url, u.bio, u.created_at as u_created_at, u.updated_at as u_updated_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ?
    `);
    const row = stmt.get(token) as unknown as SessionRow | undefined;
    if (!row) return null;

    if (new Date(row.expires_at).getTime() < Date.now()) {
      this.deleteSession(token);
      return null;
    }

    return {
      session: {
        id: row.s_id,
        session_token: row.session_token,
        user_id: row.user_id,
        expires_at: row.expires_at,
        created_at: row.s_created_at,
      },
      user: {
        id: row.u_id,
        github_id: row.github_id,
        login: row.login,
        name: row.name,
        email: row.email,
        avatar_url: row.avatar_url,
        bio: row.bio,
        created_at: row.u_created_at,
        updated_at: row.u_updated_at,
      },
    };
  },

  deleteSession(token: string): void {
    const db = getDb();
    const stmt = db.prepare("DELETE FROM sessions WHERE session_token = ?");
    stmt.run(token);
  },

  getPreferences(userId: string): UserPreferencesRecord | null {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM user_preferences WHERE user_id = ?");
    const result = stmt.get(userId) as unknown as UserPreferencesRecord;
    return result || null;
  },

  updatePreferences(userId: string, data: Partial<Omit<UserPreferencesRecord, "user_id">>): UserPreferencesRecord {
    const db = getDb();
    const current = this.getPreferences(userId);
    const now = new Date().toISOString();

    if (!current) {
      const stmt = db.prepare(`
        INSERT INTO user_preferences (user_id, theme, glass, locale, density, accent_color, sidebar_collapsed, widget_config, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        userId,
        data.theme ?? "",
        data.glass ?? 1,
        data.locale ?? "en",
        data.density ?? "comfortable",
        data.accent_color ?? "default",
        data.sidebar_collapsed ?? 0,
        data.widget_config ?? "{}",
        now
      );
    } else {
      const merged = { ...current, ...data };
      const stmt = db.prepare(`
        UPDATE user_preferences
        SET theme = ?, glass = ?, locale = ?, density = ?, accent_color = ?, sidebar_collapsed = ?, widget_config = ?, updated_at = ?
        WHERE user_id = ?
      `);
      stmt.run(
        merged.theme,
        merged.glass,
        merged.locale,
        merged.density,
        merged.accent_color,
        merged.sidebar_collapsed,
        merged.widget_config,
        now,
        userId
      );
    }
    return this.getPreferences(userId)!;
  },

  getFavoriteRepositories(userId: string): { id: string; repo_id: number; repo_full_name: string; created_at: string }[] {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM favorite_repositories WHERE user_id = ? ORDER BY created_at DESC");
    return stmt.all(userId) as unknown as { id: string; repo_id: number; repo_full_name: string; created_at: string }[];
  },

  addFavoriteRepository(userId: string, repoId: number, repoFullName: string): void {
    const db = getDb();
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO favorite_repositories (id, user_id, repo_id, repo_full_name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, repoId, repoFullName, new Date().toISOString());
  },

  removeFavoriteRepository(userId: string, repoId: number): void {
    const db = getDb();
    const stmt = db.prepare("DELETE FROM favorite_repositories WHERE user_id = ? AND repo_id = ?");
    stmt.run(userId, repoId);
  },

  getSavedComparisons(userId: string): { id: string; user_id: string; title: string; repo_names: string; created_at: string }[] {
    const db = getDb();
    const stmt = db.prepare("SELECT * FROM saved_comparisons WHERE user_id = ? ORDER BY created_at DESC");
    return stmt.all(userId) as unknown as { id: string; user_id: string; title: string; repo_names: string; created_at: string }[];
  },

  saveComparison(userId: string, title: string, repoNames: string[]) {
    const db = getDb();
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO saved_comparisons (id, user_id, title, repo_names, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, title, JSON.stringify(repoNames), new Date().toISOString());
    return id;
  },

  deleteComparison(userId: string, comparisonId: string) {
    const db = getDb();
    const stmt = db.prepare("DELETE FROM saved_comparisons WHERE id = ? AND user_id = ?");
    stmt.run(comparisonId, userId);
  }
};

# Repora Database Architecture

Repora uses a zero-config, embedded SQLite architecture by default via Node.js built-in `node:sqlite`. It requires no external database services to get started, while fully supporting PostgreSQL for production deployments.

## Storage Engine & Local Setup

- **Local Development / Self-Hosted**: SQLite file stored at `data/repora.db` (auto-created on startup with WAL mode and foreign keys enabled).
- **In-Memory / Test Suite**: Uses `:memory:` when running automated tests (`process.env.REPORA_TEST_DB = "1"`).
- **Production PostgreSQL Compatibility**: All schema definitions are ANSI-SQL standard and map directly to PostgreSQL tables.

## Schema Overview

### 1. `users`
Stores authenticated user profile information synced from GitHub OAuth.
- `id`: UUID primary key
- `github_id`: Unique GitHub user ID
- `login`: GitHub username
- `name`: Display name
- `email`: Primary email address
- `avatar_url`: User avatar image URL
- `bio`: User bio
- `created_at`, `updated_at`: Timestamps

### 2. `accounts`
Stores OAuth connection details and authorization tokens.
- `id`: UUID primary key
- `user_id`: Foreign key referencing `users(id)` (ON DELETE CASCADE)
- `provider`: Identity provider (`github`)
- `provider_account_id`: Provider-specific ID
- `access_token`: Encrypted/protected OAuth access token
- `scope`: Granted OAuth scopes (e.g., `read:user`, `repo`)
- `created_at`: Timestamp

### 3. `sessions`
Manages authenticated browser sessions.
- `id`: UUID primary key
- `session_token`: Cryptographically secure random session token
- `user_id`: Foreign key referencing `users(id)` (ON DELETE CASCADE)
- `expires_at`: Expiration timestamp (default 30 days)
- `created_at`: Timestamp

### 4. `user_preferences`
Stores personalized UI and dashboard preferences.
- `user_id`: Foreign key referencing `users(id)` (ON DELETE CASCADE)
- `theme`: Selected theme (one of the 22 supported themes)
- `glass`: Glassmorphism toggle (0 or 1)
- `locale`: Language code (`en` or `tr`)
- `density`: Layout density (`comfortable` or `compact`)
- `accent_color`: Accent color override
- `sidebar_collapsed`: Sidebar collapsed state (0 or 1)
- `widget_config`: JSON string defining widget ordering and visibility
- `updated_at`: Timestamp

### 5. `favorite_repositories`
Stores repositories bookmarked by the user.
- `id`: UUID primary key
- `user_id`: Foreign key referencing `users(id)` (ON DELETE CASCADE)
- `repo_id`: GitHub repository ID
- `repo_full_name`: Repository name (e.g., `facebook/react`)
- `created_at`: Timestamp

### 6. `saved_comparisons`
Stores user-saved side-by-side repository comparisons.
- `id`: UUID primary key
- `user_id`: Foreign key referencing `users(id)` (ON DELETE CASCADE)
- `title`: Comparison title
- `repo_names`: JSON array of repository full names
- `created_at`: Timestamp

## Migrations & Schema DDL

The SQL schema is located at `src/lib/db/schema.sql`. Schema initialization and upgrades are run automatically on application startup.

To export the schema to PostgreSQL:
```sql
-- PostgreSQL equivalent initialization:
-- UUID generation can use gen_random_uuid()
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT UNIQUE,
  login VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- See src/lib/db/schema.sql for the complete table definitions.
```

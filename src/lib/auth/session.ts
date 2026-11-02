import { cookies } from "next/headers";
import { connection } from "next/server";
import { dbRepository, type UserRecord, type UserPreferencesRecord } from "@/lib/db/client";

export const SESSION_COOKIE_NAME = "repora_session";
export const STATE_COOKIE_NAME = "repora_oauth_state";

export interface SessionContext {
  authenticated: boolean;
  user: UserRecord | null;
  preferences: UserPreferencesRecord | null;
  isDemo?: boolean;
}

export async function getCurrentSession(): Promise<SessionContext> {
  // The synchronous SQLite driver must not run during prerendering; session
  // data is per-request. `connection()` opts this call into request time.
  await connection();
  const cookieStore = await cookies();
  try {
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return { authenticated: false, user: null, preferences: null };
    }

    const sessionData = dbRepository.findSession(token);
    if (!sessionData) {
      return { authenticated: false, user: null, preferences: null };
    }
    if (dbRepository.hasDemoAccount(sessionData.user.id)) {
      return { authenticated: false, user: null, preferences: null };
    }

    const preferences = dbRepository.getPreferences(sessionData.user.id);

    return {
      authenticated: true,
      user: sessionData.user,
      preferences,
      isDemo: false,
    };
  } catch {
    return { authenticated: false, user: null, preferences: null };
  }
}

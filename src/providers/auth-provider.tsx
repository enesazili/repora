"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  github_id: number | null;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface UserPreferences {
  theme: string;
  glass: number;
  locale: string;
  density: string;
  accent_color: string;
  sidebar_collapsed: number;
  widget_config: string;
}

export interface FavoriteRepo {
  id: string;
  repo_id: number;
  repo_full_name: string;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  preferences: UserPreferences | null;
  authenticated: boolean;
  isDemo: boolean;
  loading: boolean;
  favorites: FavoriteRepo[];
  login: () => void;
  logout: () => Promise<void>;
  updatePreferences: (data: Partial<UserPreferences>) => Promise<boolean>;
  toggleFavorite: (repoId: number, repoFullName: string) => Promise<boolean>;
  isFavorite: (repoId: number) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteRepo[]>([]);

  async function fetchSession() {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setAuthenticated(Boolean(data.authenticated));
        setUser(data.user || null);
        setPreferences(data.preferences || null);
        setIsDemo(Boolean(data.isDemo));

        if (data.authenticated) {
          fetchFavorites();
        }
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFavorites() {
    try {
      const res = await fetch("/api/user/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        setAuthenticated(Boolean(data.authenticated));
        setUser(data.user || null);
        setPreferences(data.preferences || null);
        setIsDemo(Boolean(data.isDemo));
        if (data.authenticated) {
          fetch("/api/user/favorites")
            .then((res) => (res.ok ? res.json() : null))
            .then((favData) => {
              if (mounted && favData?.favorites) setFavorites(favData.favorites);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function login() {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/api/auth/login");
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAuthenticated(false);
      setUser(null);
      setFavorites([]);
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  async function updatePreferences(data: Partial<UserPreferences>): Promise<boolean> {
    if (!authenticated) {
      return false;
    }
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        setPreferences(json.preferences);
        return true;
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
    return false;
  }

  async function toggleFavorite(repoId: number, repoFullName: string): Promise<boolean> {
    const exists = favorites.some((f) => f.repo_id === repoId);
    if (authenticated) {
      try {
        const response = exists
          ? await fetch(`/api/user/favorites?repoId=${encodeURIComponent(repoId)}`, { method: "DELETE" })
          : await fetch("/api/user/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repoId, repoFullName }) });
        if (!response.ok) return exists;
        setFavorites((previous) => exists
          ? previous.filter((favorite) => favorite.repo_id !== repoId)
          : [{ id: String(repoId), repo_id: repoId, repo_full_name: repoFullName, created_at: new Date().toISOString() }, ...previous]);
        return !exists;
      } catch {
        return exists;
      }
    }
    if (exists) {
      setFavorites((prev) => prev.filter((f) => f.repo_id !== repoId));
      try {
        const stored: FavoriteRepo[] = JSON.parse(localStorage.getItem("repora.favorites") || "[]");
        const next = stored.filter((f) => f.repo_id !== repoId);
        localStorage.setItem("repora.favorites", JSON.stringify(next));
      } catch {}
      return false;
    } else {
      const item: FavoriteRepo = {
        id: String(repoId),
        repo_id: repoId,
        repo_full_name: repoFullName,
        created_at: new Date().toISOString(),
      };
      setFavorites((prev) => [item, ...prev]);
      try {
        const stored = JSON.parse(localStorage.getItem("repora.favorites") || "[]");
        localStorage.setItem("repora.favorites", JSON.stringify([item, ...stored]));
      } catch {}
      return true;
    }
  }

  function isFavorite(repoId: number): boolean {
    return favorites.some((f) => f.repo_id === repoId);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        authenticated,
        isDemo,
        loading,
        favorites,
        login,
        logout,
        updatePreferences,
        toggleFavorite,
        isFavorite,
        refreshSession: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

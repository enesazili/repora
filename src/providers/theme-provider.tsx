"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PALETTE_ID,
  isColorMode,
  isPaletteId,
  resolveLegacyTheme,
  type ColorMode,
  type PaletteId,
} from "@/config/themes";
import { useAuth } from "@/providers/auth-provider";
import {
  applyAppearanceToDocument,
  clearAllDisplayPreferences,
  clearAppearancePreferences,
  GLASS_STORAGE_KEY,
  hasStoredAppearance,
  LEGACY_THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  MOTION_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  persistAppearance,
  persistGlass,
  persistMotion,
  resolveInitialAppearance,
  resolveInitialGlass,
  resolveInitialMotion,
  resolveSystemMode,
  type StoredAppearance,
} from "@/lib/theme/storage";

interface AppearanceContextValue {
  palette: PaletteId;
  mode: ColorMode;
  glass: boolean;
  reducedMotion: boolean;
  setPalette: (palette: PaletteId) => void;
  setMode: (mode: ColorMode) => void;
  setGlass: (glass: boolean) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  resetAppearance: () => void;
  resetAllPreferences: () => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

/** Parse the `theme` account preference, accepting the retired theme ids. */
function parsePreferenceTheme(value: string | null | undefined): StoredAppearance | null {
  if (!value) {
    return null;
  }

  const [palette, mode] = value.split(":");
  if (isPaletteId(palette) && isColorMode(mode)) {
    return { palette, mode };
  }

  return resolveLegacyTheme(value);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { authenticated, preferences, updatePreferences } = useAuth();

  /*
   * Lazy initialisers read the same source as the inline boot script. The
   * script updates <html> before paint, so the first client render matches
   * the DOM. Preference UI additionally waits for `useHydrated` because the
   * server markup necessarily uses defaults.
   */
  const [appearance, setAppearanceState] =
    useState<StoredAppearance>(resolveInitialAppearance);
  const [glass, setGlassState] = useState<boolean>(resolveInitialGlass);
  const [reducedMotion, setReducedMotionState] =
    useState<boolean>(resolveInitialMotion);
  const adoptedAccountPreferences = useRef(false);

  // Re-apply after React's dev-mode remount resets <html> attributes.
  useLayoutEffect(() => {
    applyAppearanceToDocument(
      appearance.palette,
      appearance.mode,
      glass,
      reducedMotion,
    );
  }, [appearance, glass, reducedMotion]);

  // Adopt account preferences once for a new device without local values.
  useEffect(() => {
    if (adoptedAccountPreferences.current || !authenticated || !preferences) {
      return;
    }
    adoptedAccountPreferences.current = true;

    if (!hasStoredAppearance()) {
      const stored = parsePreferenceTheme(preferences.theme);
      if (stored) {
        persistAppearance(stored.palette, stored.mode);
        queueMicrotask(() => setAppearanceState(stored));
      }
    }

    try {
      const localGlass = window.localStorage.getItem(GLASS_STORAGE_KEY);
      if (localGlass === null) {
        const adoptedGlass = preferences.glass !== 0;
        persistGlass(adoptedGlass);
        queueMicrotask(() => setGlassState(adoptedGlass));
      }
      if (window.localStorage.getItem(MOTION_STORAGE_KEY) === null) {
        queueMicrotask(() => setReducedMotionState(false));
      }
    } catch {
      // Storage may be unavailable; keep the local defaults.
    }
  }, [authenticated, preferences]);

  const syncAccount = useCallback(
    (palette: PaletteId, mode: ColorMode, nextGlass: boolean) => {
      if (!authenticated) {
        return;
      }
      void updatePreferences({ theme: `${palette}:${mode}`, glass: nextGlass ? 1 : 0 });
    },
    [authenticated, updatePreferences],
  );

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.key === PALETTE_STORAGE_KEY ||
        event.key === MODE_STORAGE_KEY ||
        event.key === LEGACY_THEME_STORAGE_KEY
      ) {
        setAppearanceState(resolveInitialAppearance());
      }

      if (event.key === GLASS_STORAGE_KEY) {
        setGlassState(event.newValue !== "off");
      }

      if (event.key === MOTION_STORAGE_KEY) {
        setReducedMotionState(event.newValue === "on");
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setPalette = useCallback(
    (palette: PaletteId) => {
      setAppearanceState((current) => ({ ...current, palette }));
      persistAppearance(palette, appearance.mode);
      applyAppearanceToDocument(palette, appearance.mode, glass, reducedMotion);
      syncAccount(palette, appearance.mode, glass);
    },
    [appearance.mode, glass, reducedMotion, syncAccount],
  );

  const setMode = useCallback(
    (mode: ColorMode) => {
      setAppearanceState((current) => ({ ...current, mode }));
      persistAppearance(appearance.palette, mode);
      applyAppearanceToDocument(appearance.palette, mode, glass, reducedMotion);
      syncAccount(appearance.palette, mode, glass);
    },
    [appearance.palette, glass, reducedMotion, syncAccount],
  );

  const setGlass = useCallback(
    (nextGlass: boolean) => {
      setGlassState(nextGlass);
      persistGlass(nextGlass);
      applyAppearanceToDocument(
        appearance.palette,
        appearance.mode,
        nextGlass,
        reducedMotion,
      );
      syncAccount(appearance.palette, appearance.mode, nextGlass);
    },
    [appearance, reducedMotion, syncAccount],
  );

  const setReducedMotion = useCallback(
    (nextReducedMotion: boolean) => {
      setReducedMotionState(nextReducedMotion);
      persistMotion(nextReducedMotion);
      applyAppearanceToDocument(
        appearance.palette,
        appearance.mode,
        glass,
        nextReducedMotion,
      );
    },
    [appearance, glass],
  );

  const resetAppearance = useCallback(() => {
    const mode = resolveSystemMode();
    clearAppearancePreferences();
    setAppearanceState({ palette: DEFAULT_PALETTE_ID, mode });
    setGlassState(true);
    setReducedMotionState(false);
    applyAppearanceToDocument(DEFAULT_PALETTE_ID, mode, true, false);
    if (authenticated) {
      void updatePreferences({
        theme: `${DEFAULT_PALETTE_ID}:${mode}`,
        glass: 1,
      });
    }
  }, [authenticated, updatePreferences]);

  const resetAllPreferences = useCallback(() => {
    const mode = resolveSystemMode();
    clearAllDisplayPreferences();
    setAppearanceState({ palette: DEFAULT_PALETTE_ID, mode });
    setGlassState(true);
    setReducedMotionState(false);
    applyAppearanceToDocument(DEFAULT_PALETTE_ID, mode, true, false);
    if (authenticated) {
      void updatePreferences({
        theme: `${DEFAULT_PALETTE_ID}:${mode}`,
        glass: 1,
        widget_config: "{}",
      });
    }
  }, [authenticated, updatePreferences]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      palette: appearance.palette,
      mode: appearance.mode,
      glass,
      reducedMotion,
      setPalette,
      setMode,
      setGlass,
      setReducedMotion,
      resetAppearance,
      resetAllPreferences,
    }),
    [
      appearance,
      glass,
      reducedMotion,
      setPalette,
      setMode,
      setGlass,
      setReducedMotion,
      resetAppearance,
      resetAllPreferences,
    ],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useTheme(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }
  return context;
}

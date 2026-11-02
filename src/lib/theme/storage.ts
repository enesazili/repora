import {
  COLOR_MODE_SET,
  DEFAULT_COLOR_MODE,
  DEFAULT_PALETTE_ID,
  PALETTE_ID_SET,
  resolveLegacyTheme,
  type ColorMode,
  type PaletteId,
} from "@/config/themes";

export const PALETTE_STORAGE_KEY = "repora.palette";
export const MODE_STORAGE_KEY = "repora.mode";
export const LEGACY_THEME_STORAGE_KEY = "repora.theme";
export const GLASS_STORAGE_KEY = "repora.glass";
export const MOTION_STORAGE_KEY = "repora.motion";

export interface StoredAppearance {
  palette: PaletteId;
  mode: ColorMode;
}

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("Repora: appearance preference could not be read.", error);
    return null;
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Repora: appearance preference could not be saved.", error);
  }
}

function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("Repora: appearance preference could not be cleared.", error);
  }
}

export function resolveSystemMode(): ColorMode {
  if (typeof window === "undefined") {
    return DEFAULT_COLOR_MODE;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function hasStoredAppearance(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    readItem(PALETTE_STORAGE_KEY) !== null || readItem(MODE_STORAGE_KEY) !== null
  );
}

/**
 * Migrates the retired 22-theme key to a palette + mode pair. The legacy key is
 * removed so migration only runs once. New keys always win when present.
 */
export function migrateLegacyTheme(): StoredAppearance | null {
  if (typeof window === "undefined") {
    return null;
  }

  const legacy = readItem(LEGACY_THEME_STORAGE_KEY);
  if (!legacy) {
    return null;
  }

  const mapped = resolveLegacyTheme(legacy);
  if (!mapped) {
    removeItem(LEGACY_THEME_STORAGE_KEY);
    return null;
  }

  writeItem(PALETTE_STORAGE_KEY, mapped.palette);
  writeItem(MODE_STORAGE_KEY, mapped.mode);
  removeItem(LEGACY_THEME_STORAGE_KEY);
  return mapped;
}

/**
 * Resolve the initial palette + mode. Stored values win; otherwise migrate a
 * legacy theme, then fall back to the default palette and the OS colour scheme.
 * Must stay in sync with the inline boot script in `theme-script.tsx`.
 */
export function resolveInitialAppearance(): StoredAppearance {
  if (typeof window === "undefined") {
    return { palette: DEFAULT_PALETTE_ID, mode: DEFAULT_COLOR_MODE };
  }

  let storedPalette = readItem(PALETTE_STORAGE_KEY);
  let storedMode = readItem(MODE_STORAGE_KEY);

  if (storedPalette === null && storedMode === null) {
    const migrated = migrateLegacyTheme();
    if (migrated) {
      storedPalette = migrated.palette;
      storedMode = migrated.mode;
    }
  }

  const palette: PaletteId =
    storedPalette && PALETTE_ID_SET.has(storedPalette)
      ? (storedPalette as PaletteId)
      : DEFAULT_PALETTE_ID;
  const mode: ColorMode =
    storedMode && COLOR_MODE_SET.has(storedMode)
      ? (storedMode as ColorMode)
      : resolveSystemMode();

  return { palette, mode };
}

export function resolveInitialGlass(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return readItem(GLASS_STORAGE_KEY) !== "off";
}

export function resolveInitialMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return readItem(MOTION_STORAGE_KEY) === "on";
}

export function applyAppearanceToDocument(
  palette: PaletteId,
  mode: ColorMode,
  glass: boolean,
  reducedMotion: boolean,
): void {
  const root = document.documentElement;
  root.dataset.palette = palette;
  root.dataset.mode = mode;
  root.dataset.glass = glass ? "on" : "off";
  root.dataset.motion = reducedMotion ? "reduced" : "full";
  root.removeAttribute("data-theme");
}

export function persistAppearance(palette: PaletteId, mode: ColorMode): void {
  writeItem(PALETTE_STORAGE_KEY, palette);
  writeItem(MODE_STORAGE_KEY, mode);
}

export function persistGlass(glass: boolean): void {
  writeItem(GLASS_STORAGE_KEY, glass ? "on" : "off");
}

export function persistMotion(reducedMotion: boolean): void {
  writeItem(MOTION_STORAGE_KEY, reducedMotion ? "on" : "off");
}

/**
 * Reset the display preferences owned by the Appearance panel: palette, mode,
 * glass and motion. Keeps locale and the dashboard layout.
 */
export function clearAppearancePreferences(): void {
  removeItem(PALETTE_STORAGE_KEY);
  removeItem(MODE_STORAGE_KEY);
  removeItem(LEGACY_THEME_STORAGE_KEY);
  removeItem(GLASS_STORAGE_KEY);
  removeItem(MOTION_STORAGE_KEY);
}

/** Reset every local display preference Repora owns. */
export function clearAllDisplayPreferences(): void {
  clearAppearancePreferences();
  removeItem(MOTION_STORAGE_KEY);
  removeItem("repora.accent");
  removeItem("repora.density");
  removeItem("repora.widgets");
}

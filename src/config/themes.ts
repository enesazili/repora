/**
 * Central appearance registry.
 *
 * Repora ships six deliberately designed palettes. Each palette defines a
 * complete light and dark token set in `src/styles/themes.css` under
 * `[data-palette="<id>"][data-mode="<light|dark>"]`, so a single palette can be
 * previewed in isolation (the settings page renders scoped previews).
 *
 * To add a palette:
 *   1. Add its id here (and to PALETTES).
 *   2. Add matching light and dark token blocks in themes.css.
 *   3. Run `npm run check:themes` to verify WCAG contrast in both modes.
 */

export const PALETTE_IDS = [
  "default",
  "nord",
  "gruvbox",
  "solarized",
  "rose",
  "monokai",
] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

export const COLOR_MODES = ["light", "dark"] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

export type PaletteNoteKey =
  | "paletteDefaultNote"
  | "paletteNordNote"
  | "paletteGruvboxNote"
  | "paletteSolarizedNote"
  | "paletteRoseNote"
  | "paletteMonokaiNote";

export interface PaletteDefinition {
  id: PaletteId;
  /** Product name; palette names are brand names and stay untranslated. */
  name: string;
  /** Translation key for the one-line description on the palette card. */
  noteKey: PaletteNoteKey;
}

export const PALETTES: readonly PaletteDefinition[] = [
  {
    id: "default",
    name: "Default",
    noteKey: "paletteDefaultNote",
  },
  {
    id: "nord",
    name: "Nord",
    noteKey: "paletteNordNote",
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    noteKey: "paletteGruvboxNote",
  },
  {
    id: "solarized",
    name: "Solarized",
    noteKey: "paletteSolarizedNote",
  },
  {
    id: "rose",
    name: "Rose",
    noteKey: "paletteRoseNote",
  },
  {
    id: "monokai",
    name: "Monokai",
    noteKey: "paletteMonokaiNote",
  },
];

export const DEFAULT_PALETTE_ID: PaletteId = "default";
export const DEFAULT_COLOR_MODE: ColorMode = "dark";

export const PALETTE_ID_SET: ReadonlySet<string> = new Set(PALETTE_IDS);
export const COLOR_MODE_SET: ReadonlySet<string> = new Set(COLOR_MODES);

export function isPaletteId(value: string | null | undefined): value is PaletteId {
  return typeof value === "string" && PALETTE_ID_SET.has(value);
}

export function isColorMode(value: string | null | undefined): value is ColorMode {
  return typeof value === "string" && COLOR_MODE_SET.has(value);
}

export function getPalette(id: PaletteId): PaletteDefinition {
  const palette = PALETTES.find((item) => item.id === id);
  if (!palette) {
    throw new Error(`Unknown palette id: ${id}`);
  }
  return palette;
}

/**
 * The retired 22-theme registry, mapped onto the closest surviving palette and
 * mode. Used to migrate stored preferences without losing the user's choice.
 */
export const LEGACY_THEME_MAP: Readonly<
  Record<string, { palette: PaletteId; mode: ColorMode }>
> = {
  "github-light": { palette: "default", mode: "light" },
  "github-dark": { palette: "default", mode: "dark" },
  "solarized-light": { palette: "solarized", mode: "light" },
  "solarized-dark": { palette: "solarized", mode: "dark" },
  dracula: { palette: "rose", mode: "dark" },
  monokai: { palette: "monokai", mode: "dark" },
  nord: { palette: "nord", mode: "dark" },
  "gruvbox-light": { palette: "gruvbox", mode: "light" },
  "gruvbox-dark": { palette: "gruvbox", mode: "dark" },
  "one-dark": { palette: "default", mode: "dark" },
  "catppuccin-latte": { palette: "nord", mode: "light" },
  "catppuccin-frappe": { palette: "nord", mode: "dark" },
  "catppuccin-macchiato": { palette: "nord", mode: "dark" },
  "catppuccin-mocha": { palette: "nord", mode: "dark" },
  "tokyo-night": { palette: "nord", mode: "dark" },
  "rose-pine": { palette: "rose", mode: "dark" },
  "rose-pine-moon": { palette: "rose", mode: "dark" },
  "ayu-dark": { palette: "gruvbox", mode: "dark" },
  "everforest-dark": { palette: "gruvbox", mode: "dark" },
  kanagawa: { palette: "solarized", mode: "dark" },
  "night-owl": { palette: "default", mode: "dark" },
  "material-palenight": { palette: "rose", mode: "dark" },
};

export function resolveLegacyTheme(
  value: string | null | undefined,
): { palette: PaletteId; mode: ColorMode } | null {
  if (typeof value !== "string") {
    return null;
  }
  return LEGACY_THEME_MAP[value] ?? null;
}

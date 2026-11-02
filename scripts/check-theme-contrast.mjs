/**
 * Appearance contrast audit.
 *
 * Parses the semantic token blocks in `src/styles/themes.css` and checks the
 * text/UI pairs Repora actually uses against WCAG 2.1 contrast thresholds:
 *   4.5:1 for body text, 3:1 for large text and UI/chart marks.
 *
 * Every palette must define both a light and a dark block.
 *
 * Usage: npm run check:themes
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_PATH = join(process.cwd(), "src", "styles", "themes.css");
const css = readFileSync(CSS_PATH, "utf8");

const EXPECTED_PALETTES = [
  "default",
  "nord",
  "gruvbox",
  "solarized",
  "rose",
  "monokai",
];
const EXPECTED_MODES = ["light", "dark"];

/** @typedef {{ [token: string]: string }} TokenMap */

function parseThemes(source) {
  /** @type {Map<string, TokenMap>} */
  const themes = new Map();
  const blockPattern =
    /\[data-palette="([^"]+)"\]\[data-mode="([^"]+)"\]\s*\{([^}]*)\}/g;
  let block;

  while ((block = blockPattern.exec(source)) !== null) {
    const [, palette, mode, body] = block;
    const id = `${palette}/${mode}`;
    const tokens = themes.get(id) ?? {};

    for (const declaration of body.split(";")) {
      const separator = declaration.indexOf(":");
      if (separator === -1) continue;

      const property = declaration.slice(0, separator).trim();
      const value = declaration.slice(separator + 1).trim();
      if (property.startsWith("--")) {
        tokens[property] = value;
      }
    }

    themes.set(id, tokens);
  }

  return themes;
}

function hexToRgb(hex) {
  const value = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Unsupported colour value: ${hex}`);
  }

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function channelToLinear(channel) {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const TEXT_PAIRS = [
  ["--foreground", "--background", 4.5],
  ["--foreground", "--surface", 4.5],
  ["--foreground", "--surface-secondary", 4.5],
  ["--foreground", "--sidebar", 4.5],
  ["--muted-foreground", "--background", 4.5],
  ["--muted-foreground", "--surface", 4.5],
  ["--muted-foreground", "--surface-secondary", 4.5],
  ["--muted-foreground", "--sidebar", 4.5],
  ["--accent-foreground", "--accent", 4.5],
  ["--success", "--surface", 4.5],
  ["--warning", "--surface", 4.5],
  ["--danger", "--surface", 4.5],
];

const UI_PAIRS = [
  ["--accent", "--surface", 3],
  ["--accent", "--background", 3],
  ["--chart-1", "--surface", 3],
  ["--chart-2", "--surface", 3],
  ["--chart-3", "--surface", 3],
  ["--chart-4", "--surface", 3],
  ["--chart-5", "--surface", 3],
];

const themes = parseThemes(css);

if (themes.size === 0) {
  console.error("No palette/mode blocks found in src/styles/themes.css");
  process.exit(1);
}

let failures = 0;
let checks = 0;

for (const palette of EXPECTED_PALETTES) {
  for (const mode of EXPECTED_MODES) {
    const id = `${palette}/${mode}`;
    if (!themes.has(id)) {
      console.log(`\nFAIL  ${id}  (missing token block)`);
      failures += 1;
    }
  }
}

for (const [themeId, tokens] of themes) {
  const rows = [];

  for (const [foreground, background, minimum] of [
    ...TEXT_PAIRS,
    ...UI_PAIRS,
  ]) {
    const fg = tokens[foreground];
    const bg = tokens[background];

    if (!fg || !bg) {
      rows.push({
        pair: `${foreground} on ${background}`,
        ratio: "missing",
        minimum,
        pass: false,
      });
      failures += 1;
      continue;
    }

    const ratio = contrast(fg, bg);
    const pass = ratio >= minimum;
    checks += 1;
    if (!pass) failures += 1;

    rows.push({
      pair: `${foreground} on ${background}`,
      ratio: ratio.toFixed(2),
      minimum,
      pass,
    });
  }

  const failed = rows.filter((row) => !row.pass);
  const status = failed.length === 0 ? "PASS" : "FAIL";
  console.log(
    `\n${status}  ${themeId}  (${rows.length - failed.length}/${rows.length} pairs)`,
  );

  for (const row of failed) {
    console.log(
      `   x ${row.pair.padEnd(44)} ${String(row.ratio).padStart(7)} < ${row.minimum}:1`,
    );
  }
}

console.log(
  `\n${checks} contrast checks across ${themes.size} palette/mode combinations — ${
    failures === 0 ? "all passed" : `${failures} failed`
  }.`,
);

process.exit(failures === 0 ? 0 : 1);

import {
  COLOR_MODES,
  DEFAULT_COLOR_MODE,
  DEFAULT_PALETTE_ID,
  LEGACY_THEME_MAP,
  PALETTE_IDS,
} from "@/config/themes";
import {
  GLASS_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  MOTION_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
} from "./storage";

/**
 * Runs synchronously in <head> before the first paint. It prevents a flash of
 * the wrong palette/mode and migrates the retired 22-theme key. Keep the
 * resolution order aligned with `resolveInitialAppearance`.
 */
function buildThemeScript(): string {
  const palettes = JSON.stringify(PALETTE_IDS);
  const modes = JSON.stringify(COLOR_MODES);
  const legacy = JSON.stringify(LEGACY_THEME_MAP);

  return `(function(){var d=document.documentElement;try{var P=${palettes},M=${modes},L=${legacy};var p=localStorage.getItem(${JSON.stringify(
    PALETTE_STORAGE_KEY,
  )}),m=localStorage.getItem(${JSON.stringify(
    MODE_STORAGE_KEY,
  )});if(p===null&&m===null){var t=localStorage.getItem(${JSON.stringify(
    LEGACY_THEME_STORAGE_KEY,
  )});var x=t&&L[t];if(x){p=x.palette;m=x.mode;localStorage.setItem(${JSON.stringify(
    PALETTE_STORAGE_KEY,
  )},p);localStorage.setItem(${JSON.stringify(
    MODE_STORAGE_KEY,
  )},m);localStorage.removeItem(${JSON.stringify(
    LEGACY_THEME_STORAGE_KEY,
  )});}}if(!p||P.indexOf(p)===-1){p=${JSON.stringify(
    DEFAULT_PALETTE_ID,
  )};}if(!m||M.indexOf(m)===-1){m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":${JSON.stringify(
    DEFAULT_COLOR_MODE,
  )};}var g=localStorage.getItem(${JSON.stringify(
    GLASS_STORAGE_KEY,
  )})!=="off";var r=localStorage.getItem(${JSON.stringify(
    MOTION_STORAGE_KEY,
  )})==="on";d.setAttribute("data-palette",p);d.setAttribute("data-mode",m);d.setAttribute("data-glass",g?"on":"off");d.setAttribute("data-motion",r?"reduced":"full");d.removeAttribute("data-theme");}catch(e){d.setAttribute("data-palette",${JSON.stringify(
    DEFAULT_PALETTE_ID,
  )});d.setAttribute("data-mode",${JSON.stringify(
    DEFAULT_COLOR_MODE,
  )});d.setAttribute("data-glass","on");d.setAttribute("data-motion","full");}})();`;
}

export function ThemeScript() {
  return (
    <script
      // The content is a static string built from local constants.
      dangerouslySetInnerHTML={{ __html: buildThemeScript() }}
    />
  );
}

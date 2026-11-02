import type { ColorMode, PaletteId } from "@/config/themes";

/**
 * A miniature, purely decorative rendering of the dashboard using a scoped
 * palette/mode. Because the token blocks are declared on
 * `[data-palette][data-mode]`, wrapping the preview in those attributes
 * previews a combination without touching the app.
 */
export function ThemePreview({
  palette,
  mode,
}: {
  palette: PaletteId;
  mode: ColorMode;
}) {
  return (
    <span
      data-palette={palette}
      data-mode={mode}
      aria-hidden="true"
      className="theme-preview block aspect-[16/10] w-full"
    >
      <span className="flex h-full">
        <span className="theme-preview__sidebar flex w-[31%] flex-col gap-1.5 p-2">
          <span className="flex items-center gap-1">
            <span className="theme-preview__accent size-2 rounded-[3px]" />
            <span className="theme-preview__text h-1 w-6 rounded-full" />
          </span>
          <span className="mt-1 h-1 w-full rounded-full bg-[var(--accent)] opacity-80" />
          <span className="theme-preview__muted h-1 w-4/5 rounded-full" />
          <span className="theme-preview__muted h-1 w-3/5 rounded-full" />
          <span className="theme-preview__muted h-1 w-2/3 rounded-full" />
          <span className="theme-preview__muted mt-auto h-1 w-1/2 rounded-full" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="theme-preview__topbar flex h-4 items-center gap-1 px-2">
            <span className="theme-preview__muted h-1 w-7 rounded-full" />
            <span className="theme-preview__muted ml-auto size-1.5 rounded-full" />
            <span className="theme-preview__accent size-1.5 rounded-full" />
          </span>

          <span className="flex flex-1 flex-col gap-1.5 p-2">
            <span className="flex gap-1.5">
              <span className="theme-preview__surface h-4 flex-1 rounded-[3px]" />
              <span className="theme-preview__surface h-4 flex-1 rounded-[3px]" />
            </span>
            <span className="theme-preview__surface flex flex-1 items-end gap-[3px] rounded-[3px] p-1.5">
              <span className="h-2 flex-1 rounded-[1px] bg-[var(--chart-2)] opacity-80" />
              <span className="h-3 flex-1 rounded-[1px] bg-[var(--chart-2)] opacity-80" />
              <span className="h-2.5 flex-1 rounded-[1px] bg-[var(--accent)]" />
              <span className="h-4 flex-1 rounded-[1px] bg-[var(--accent)]" />
              <span className="h-3.5 flex-1 rounded-[1px] bg-[var(--chart-3)] opacity-90" />
              <span className="h-5 flex-1 rounded-[1px] bg-[var(--accent)]" />
            </span>
            <span className="flex gap-1.5">
              <span className="theme-preview__surface-secondary h-1.5 flex-1 rounded-full" />
              <span className="theme-preview__surface-secondary h-1.5 w-6 rounded-full" />
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

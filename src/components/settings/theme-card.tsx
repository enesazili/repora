import { Check } from "lucide-react";
import type {
  ColorMode,
  PaletteDefinition,
  PaletteId,
} from "@/config/themes";
import { useLocale } from "@/i18n";
import { cn } from "@/lib/utils";
import { ThemePreview } from "./theme-preview";

interface ThemeCardProps {
  palette: PaletteDefinition;
  mode: ColorMode;
  selected: boolean;
  onSelect: (paletteId: PaletteId) => void;
}

export function ThemeCard({ palette, mode, selected, onSelect }: ThemeCardProps) {
  const { t } = useLocale();

  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col gap-2 rounded-[11px] border p-2 transition-colors duration-150",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ring)]",
        selected
          ? "border-accent bg-accent-subtle"
          : "border-border bg-surface hover:border-border-strong",
      )}
    >
      <input
        type="radio"
        name="repora-palette"
        value={palette.id}
        checked={selected}
        onChange={() => onSelect(palette.id)}
        className="sr-only"
      />

      <span className="grid grid-cols-2 gap-1.5">
        {(["light", "dark"] as const).map((previewMode) => (
          <span key={previewMode} className="min-w-0">
            <span
              className={cn(
                "block rounded-[8px] p-px transition-shadow",
                previewMode === mode
                  ? "ring-1 ring-accent ring-offset-1 ring-offset-surface"
                  : "ring-1 ring-transparent",
              )}
            >
              <ThemePreview palette={palette.id} mode={previewMode} />
            </span>
            <span
              className={cn(
                "mt-1 block text-center text-[9.5px] font-medium tracking-[0.06em] uppercase",
                previewMode === mode
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {t(previewMode)}
            </span>
          </span>
        ))}
      </span>

      <span className="flex items-start justify-between gap-2 px-0.5 pb-0.5">
        <span className="min-w-0">
          <span className="block truncate text-[12px] leading-4 font-medium text-foreground">
            {palette.name}
          </span>
          <span className="block truncate text-[10.5px] leading-4 text-muted-foreground">
            {t(palette.noteKey as Parameters<typeof t>[0])}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
            selected
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border-strong text-transparent",
          )}
        >
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      </span>
    </label>
  );
}

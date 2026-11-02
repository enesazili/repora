"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  describedBy?: string;
  disabled?: boolean;
}

export function Switch({
  checked,
  onChange,
  label,
  describedBy,
  disabled = false,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150",
        "after:absolute after:-inset-2.5 after:content-['']",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
        "disabled:pointer-events-none disabled:opacity-50",
        checked
          ? "border-accent bg-accent"
          : "border-border-strong bg-[var(--track-bg)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 size-5 -translate-y-1/2 rounded-full shadow-sm transition-[transform,background-color] duration-150",
          checked
            ? "left-0.5 translate-x-5 bg-[var(--accent-foreground)]"
            : "left-0.5 border border-border-strong bg-[var(--surface)]",
        )}
      />
    </button>
  );
}

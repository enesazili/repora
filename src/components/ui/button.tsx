import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "subtle";
export type ButtonSize = "sm" | "md" | "icon";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] font-medium whitespace-nowrap transition-[background-color,color,border-color,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 active:opacity-80",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-secondary",
  ghost:
    "text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
  subtle:
    "bg-surface-secondary text-foreground hover:bg-muted",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[12.5px]",
  md: "h-10 px-3.5 text-[13px]",
  icon: "size-9",
};

export function buttonClasses({
  variant = "secondary",
  size = "sm",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "secondary",
  size = "sm",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}

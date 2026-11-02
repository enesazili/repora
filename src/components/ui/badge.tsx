import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "outline";

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-secondary text-muted-foreground",
  accent: "border-transparent bg-accent-muted text-foreground",
  success: "border-transparent bg-success-muted text-foreground",
  warning: "border-transparent bg-warning-muted text-foreground",
  danger: "border-transparent bg-danger-muted text-foreground",
  outline: "border-border bg-transparent text-muted-foreground",
};

const dotVariants: Record<BadgeVariant, string> = {
  neutral: "bg-muted-foreground",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  outline: "bg-muted-foreground",
};

interface BadgeProps extends ComponentProps<"span"> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({
  variant = "neutral",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] leading-4 font-medium whitespace-nowrap",
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", dotVariants[variant])}
        />
      ) : null}
      {children}
    </span>
  );
}

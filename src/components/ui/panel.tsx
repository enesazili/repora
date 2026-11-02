import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("panel", className)} {...props} />;
}

interface PanelHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  id?: string;
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
  id,
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 pb-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2
          id={id}
          className="text-[13.5px] font-semibold tracking-[-0.01em] text-foreground"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

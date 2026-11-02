import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.035em] text-foreground sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
